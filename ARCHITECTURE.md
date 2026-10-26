# a1-mcp-server — как устроен и как работает (глубокий разбор)

Этот документ — детальное объяснение **внутреннего устройства** и **рабочего
процесса** MCP-сервера для Платформы А1. В отличие от `README.md` (который
описывает возможности, инструменты и статус), здесь мы разбираем **каждый
слой, каждый файл и каждый шаг выполнения** запроса — от получения JSON-RPC
сообщения до HTTP-ответа A1.

---

## 1. Общее представление

`a1-mcp-server` — это Node.js-процесс, который:

1. Запускается MCP-клиентом (Zed, Claude Code и т.п.) как дочерний процесс.
2. Общается с клиентом по протоколу **stdio** (стандартный ввод/вывод) через
   JSON-RPC-сообщения.
3. По каждому запросу клиента («вызови инструмент X с аргументами Y»)
   выполняет **HTTP-запрос к REST API Платформы А1**.
4. Возвращает результат обратно клиенту как текст/JSON.

Это «транслятор»: язык MCP-инструментов `<->` язык REST API A1.

```
┌──────────────┐   JSON-RPC (stdio)   ┌───────────────────┐   HTTP/REST   ┌─────────────┐
│  MCP-клиент   │ ◄──────────────────► │  a1-mcp-server    │ ◄────────────► │  Платформа  │
│  (Zed/Claude) │                      │  (Node.js, TS)    │                │  А1         │
└──────────────┘                      └───────────────────┘                └─────────────┘
```

---

## 2. Входная точка: что происходит при запуске

Файл **`src/index.ts`** — точка входа (`main`-функция). Порядок при старте:

### Шаг 0 — загрузка окружения
Первая строка `index.ts` — `import "./load-env.js"`. Это **важно**, потому что
тот грузит `.env` до того, как любой другой модуль прочитает `process.env`.

`load-env.ts` делает три попытки (приоритет — первая победа):
1. `DOTENV_CONFIG_PATH` (если задан).
2. `.env` в рабочем каталоге.
3. `.env` в корне пакета (рядом с `dist/`).

`dotenv` не перезаписывает уже заданные переменные, поэтому
`env:`-переменные из конфига MCP-клиента имеют высший приоритет.

### Шаг 1 — загрузка конфигурации
`loadConfig()` (в `src/config.ts`) читает и валидирует переменные `A1_*`:
- Обязательные: `A1_BASE_URL`, `A1_USER`, `A1_PASSWORD` (иначе — исключение при
  старте, процесс падает с понятным сообщением).
- Числовые (`A1_KEEP_ALIVE_INTERVAL`, `A1_REQUEST_TIMEOUT`, `A1_MCP_HTTP_PORT`)
  — строгая проверка: нечисловое/неположительное значение = ошибка старта.
- Перечислимые (`A1_LOG_LEVEL`, `A1_MODE`, `A1_RESPONSE_MODE`,
  `A1_MCP_TRANSPORT`) — только из whitelist, иначе ошибка.

### Шаг 2 — логгер
`createLogger()` (в `src/logger.ts`) создаёт pino-логгер с:
- уровнем из `A1_LOG_LEVEL`;
- записью в **stderr** (всегда — чтобы stdout остался чистым для MCP);
- опционально в файл (`A1_LOG_FILE`);
- **маскированием секретов** через `redact` (пароль, Authorization-заголовок,
  access/refresh-токены и т.д. — никогда не попадут в логи).

### Шаг 3 — клиент
`new A1Client(config, logger)` (в `src/a1-client.ts`) создаёт:
- `A1HttpClient` (в `http.ts`) — HTTP + JWT;
- все доменные сервисы (cube, dimension, process, chore, security, monitoring,
  mdx).

### Шаг 4 — подключение
`client.connect()` пытается авторизоваться. **Важно:** ошибка подключения не
роняет сервер — процесс продолжает старт, а логин повторяется при первом
вызове инструмента (ленивый re-auth через `ensureSession()`).

### Шаг 5 — регистрация инструментов
`registerAllTools(server, client)` (в `src/tools/index.ts`) регистрирует 54
инструмента. Каждый вызов `server.tool(name, description, schema, handler)`
привязывает имя инструмента, описание, zod-схему аргументов и обработчик.

### Шаг 6 — транспорт
`new StdioServerTransport()` + `server.connect(transport)` — сервер слушает
stdio и начинает обрабатывать JSON-RPC.

### Шаг 7 — обработчики завершения
`sigint`/`sigterm`/закрытие stdin → корректный shutdown: закрыть транспорт,
`client.disconnect()` (logout `DELETE /Auth/Session`), `process.exit`.

---

## 3. Слои и их ответственность (детально)

### 3.1 `config.ts` — конфигурация

**Что делает:** превращает строки `process.env` в типизированный объект
`A1Config`.

**Интерфейс `A1Config`:**
```typescript
interface A1Config {
  baseUrl: string; user: string; password: string;
  ssl: { rejectUnauthorized: boolean };
  keepAliveIntervalMs: number; requestTimeoutMs: number;
  logLevel: "debug"|"info"|"warn"|"error";
  logFile?: string;
  transport: "stdio"|"http";
  httpHost: string; httpPort: number;
  mode: "readwrite"|"readonly";
  responseMode: "legacy"|"structured";
}
```

**Почему важен:** строгая валидация при старте ловит опечатки/неверные
значения сразу, а не тихо использует дефолты (дефолт может обернуться
«сервер не поднялся на ожидаемом порту» или «записал не туда»).

### 3.2 `types.ts` — ошибки и доменные типы

**Класс `A1Error`** — единый тип ошибки сервера. Поля:
- `code` — один из `A1ErrorCode` (`CONNECTION_FAILED`, `AUTH_FAILED`,
  `NOT_FOUND`, `CONFLICT`, `VALIDATION_ERROR`, `A1_ERROR`, ...);
- `httpStatus` — исходный HTTP-статус от A1 (если был);
- `endpoint` — какой URL вызвался;
- `details` — обрезанный (до 500 симв.) текст ответа A1;
- `hint` — подсказка агенту что делать (`hintForCode(code)`).

**Метод `toErrorPayload()`** возвращает сериализуемую версию для передачи
клиенту.

**Доменные типы** (`A1Cube`, `A1Dimension`, `A1Element`, `A1Edge`,
`A1Chore`, `A1MdxResult` и др.) — TypeScript-интерфейсы, описывающие форму
ответов A1 (по документации, раздел 7).

### 3.3 `a1-client/auth.ts` — RSA-шифрование пароля

**Что делает:** шифрует пароль для логина.

```typescript
export function rsaEncryptPassword(publicKey: string, plaintext: string): string
```

**Алгоритм:**
1. `spkiBase64ToPem(key)` — превращает base64 SPKI (который A1 возвращает в
   поле `Key`) в PEM-строку `-----BEGIN PUBLIC KEY-----…`.
2. `crypto.publicEncrypt({ key, padding: RSA_PKCS1_PADDING }, password)` —
   RSA-шифрование **PKCS#1 v1.5**.
3. Возвращает base64 шифротекста — это значение поля `Password`.

**Почему PKCS#1 v1.5, а не OAEP:** проверено на живом сервере — OAEP
возвращает 401 «Incorrect name or password», PKCS#1 v1.5 проходит. Это ошибка,
которую легко допустить (и которую мы поймали опытным путём).

### 3.4 `a1-client/http.ts` — HTTP-клиент с JWT (сердце сервера)

Это самый важный слой. Здесь живёт вся логика аутентификации и запросов.

**Состояние:**
- `session: A1Session | null` — пара `{access, refresh}` токенов в памяти.
- `authInFlight: Promise<A1Session> | null` — дедупликация параллельных логинов.

**Ключевые методы:**

**`rawFetch(method, path, init, timeoutMs)`** — низкоуровневый HTTP:
- строит полный URL (`baseUrl` + `path`);
- создаёт `AbortController` с таймаутом (обрыв запроса, если A1 не отвечает);
- вызывает `undiciFetch` с `dispatcher` (undici `Agent` с настройкой
  `rejectUnauthorized` для self-signed сертификатов);
- отключает `headersTimeout`/`bodyTimeout` (чтобы долгие операции A1, типа
  `SaveData` или MDX, не обрывались по undici-дефолту в 300 с).

**`requestJson(method, path, body, auth)`** — средний уровень:
- строит заголовки (`User-Agent`, `Accept`, `Content-Type`, `Authorization`);
- сериализует тело в JSON (если есть);
- **строит `Authorization` = голый JWT** `this.session.access` (без `Bearer` —
  это критичная находка: с `Bearer` A1 отдаёт 401);
- читает ответ как текст, пытается распарсить JSON (пустой текст → `undefined`;
  не-JSON → возвращает как текст);
- на не-`ok` статусе — классифицирует ошибку через `classifyHttpError` и
  бросает `A1Error`.

**`classifyHttpError(status, endpoint, text)`** — маппинг кода:
```
401/403 → AUTH_FAILED
404     → NOT_FOUND
409     → CONFLICT
прочее  → A1_ERROR
```

**`fetchPublicKey()`** — `GET /Auth/Session` → возвращает `Key` (RSA public key).

**`login()`** — полный handshake:
1. `fetchPublicKey()`;
2. `rsaEncryptPassword(key, password)`;
3. `POST /Auth/Session` `{Name, Password}`;
4. сохраняет `{access, refresh}` в `this.session`.

**`refresh()`** — `POST /Auth/Refresh` `{Refresh}` → новый `{access, refresh}`.

**`ensureSession()`** — возвращает существующую сессию, либо запускает логин
(и дедуплицирует параллельные вызовы через `authInFlight`). Это позволяет
не спамить логином при параллельных запросах.

**`request(method, path, body)`** — публичный метод, который используют все
сервисы:
1. `await ensureSession()` (если сессии нет — логин);
2. `requestJson(..., auth=true)`;
3. если получили `A1Error` с `AUTH_FAILED` и `httpStatus === 401` — один раз
   `refresh()` и повтор запроса;
4. иначе — пробрасывает ошибку.

**`connect()` / `disconnect()`** — авторизация при старте / logout при
завершении.

**Важный нюанс:** сессия хранится **в памяти процесса** (не в файле). При
перезапуске сервера — новый логин. Это нормально (одна сессия на процесс).

### 3.5 `a1-client/services/*.ts` — доменные сервисы

Каждый сервис — тонкая обёртка над `http.request()`, которая знает точные
URL-шаблоны A1 и форму тела. Они **не** содержат бизнес-логики — только
вызовы REST.

Пример из `cube-service.ts`:
```typescript
async getRule(name: string): Promise<{ Rule: string }> {
  const key = encodeURIComponent(`"${name}"`);   // имя в кавычках, percent-encoded
  return this.http.request<{ Rule: string }>("GET", `/Cubes(${key})/Rule/Get`);
}
```

Здесь видно **ключевое отличие URL A1** от TM1: имя объекта оборачивается в
кавычки и percent-энкодится → `/Cubes(%22name%22)` (где `%22` = `"`).

Список сервисов и их эндпоинтов:

| Сервис | Эндпоинты |
|---|---|
| `cube-service.ts` | `/Cubes`, `/Cubes(name)`, `/Cubes(name)/Rule/Get\|Set\|Check`, `/Cubes(name)/CellSet/Set`, `/Cubes(name)/Views`, `/Cubes(name)/TraceCellCalculation`, `/Cubes/CreatePicklistCube` |
| `dimension-service.ts` | `/DimensionsList`, `/Dimensions(name)`, `/Dimensions(name)/Elements\|Edges\|Attributes\|Subsets\|SubsetsList\|CubesUsed\|MaxLevel` |
| `process-service.ts` | `/Processes`, `/Processes(name)`, `/ExecCalc(name)`, `/SourcesODBC`, `/PreviewODBC` |
| `chore-service.ts` | `/Chores`, `/Chores(name)`, `/Chores(name)/Activate\|Deactivate` |
| `security-service.ts` | `/Clients`, `/Clients(name)`, `/Clients(name)/Password`, `/Groups`, `/ClientGroups`, `/ActiveUsers` |
| `monitoring-service.ts` | `/Tasks/Stats`, `/ActiveUsers`, `/Tasks(id)`, `/Tasks(id)/Move` |
| `mdx-service.ts` | `/ExecMDX`, `/SaveData`, `/SaveData(cube)` |

### 3.6 `a1-client.ts` — фасад

Просто держит инстанс `A1HttpClient` + все сервисы как readonly-поля, и
предоставляет `connect()`/`disconnect()`/`isConnected()`. Инструменты получают
`A1Client` и обращаются `client.cubes.list()`, `client.dimensions.getElements()`
и т.д.

### 3.7 `src/tools/*.ts` — инструменты MCP

Слои инструментов — это то, что «видит» LLM. Каждый инструмент:

```typescript
server.tool(
  "a1_list_cubes",                    // имя (видит агент)
  "List all cubes on the A1 server.", // описание (видит агент)
  { ...FORMAT_SCHEMA },               // zod-схема аргументов
  async ({ format }) => { ... }       // обработчик
);
```

**Что происходит при вызове инструмента (по шагам):**

1. Клиент шлёт `tools/call` с `{name: "a1_list_cubes", arguments: {...}}`.
2. MCP SDK парсит и **валидирует** аргументы через zod-схему (неверный тип
   аргумента = ошибка валидации ещё до вызова обработчика).
3. Вызывается `handler(args)`, который:
   - обращается к нужному сервису (`client.cubes.list()`),
   - тот через `http.request()` идёт в A1,
   - получает данные,
   - трансформирует их в удобный вид.
4. Результат сериализуется (JSON или Markdown-таблица) и возвращается клиенту
   через `content: [{type:"text", text:...}]`.

**Zod-схемы** в третьем аргументе делают сразу три вещи:
1. Валидация аргументов на входе.
2. Генерацию `inputSchema` (JSON Schema) для клиента — по ней LLM понимает,
   какие аргументы нужны.
3. Строгую типизацию: TypeScript выводит типы аргументов из схемы, поэтому
   внутри обработчика `name` гарантированно `string`, а не `unknown`.

**`confirm`-гуарды:** деструктивные инструменты (`a1_delete_*`,
`a1_set_cube_rule`, `a1_set_cells`, `a1_execute_process`, `a1_cancel_task`)
требуют аргумент `confirm`, равный имени цели. Это защита от случайного
срабатывания (не от злонамеренного — тот, кто может вызвать инструмент,
может и подставить `confirm`).

---

## 4. Полный разбор одного запроса (end-to-end)

Проследим **один типичный вызов** — `a1_list_cubes` с аргументом `{format:"json"}`:

### Этап 1 — клиент → сервер (JSON-RPC)
Zed шлёт на stdin процессу:
```json
{"jsonrpc":"2.0","id":7,"method":"tools/call",
 "params":{"name":"a1_list_cubes","arguments":{"format":"json"}}}
```

### Этап 2 — MCP SDK
SDK находит зарегистрированный инструмент `a1_list_cubes`, берёт его
zod-схему `{format: z.enum(["json","markdown"]).optional().default("json")}`,
парсит `arguments` → `{format: "json"}`.

### Этап 3 — обработчик
Вызывается:
```typescript
async ({ format }) => {
  const { Cubes } = await client.cubes.list();   // вызов сервиса
  const items = Cubes.map(...);                   // трансформация
  return payloadResponse(items, format, ...);     // формат ответа
}
```

### Этап 4 — сервис
`client.cubes.list()` в `cube-service.ts`:
```typescript
return this.http.request("GET", "/Cubes");
```

### Этап 5 — HTTP-клиент
`http.request("GET", "/Cubes", undefined)`:
1. `ensureSession()` — сессии нет → `login()`:
   - `GET /Auth/Session` → `{Alg:"RSA", Key:"MIGf..."}`;
   - `rsaEncryptPassword(key, "Deepseek")` → base64;
   - `POST /Auth/Session` `{Name:"Deepseek", Password:"<base64>"}` →
     `{Access:"...", Refresh:"..."}`;
   - сохранить в `this.session`.
2. `requestJson("GET", "/Cubes", undefined, auth=true)`:
   - заголовки: `Authorization: <access-jwt>` (голый), `Accept: application/json`;
   - `undiciFetch("http://127.0.0.1:7781/Cubes", {...})`.
3. Ответ A1: `200 {"Cubes":[{...},{...}]}` → парсится в объект.

### Этап 6 — трансформация и ответ
Обработчик превращает `Cubes` в массив `{name, hasRules, dimensions, security}`
и возвращает:
```json
{"content":[{"type":"text","text":"[{\"name\":\"Cub1\",...}]"}]}
```

SDK отправляет это клиенту, а Zed показывает результат агенту.

---

## 5. Поток аутентификации (подробно, с реальными данными)

```
           СЕРВЕР A1                        a1-mcp-server
               │                                   │
   [1] GET /Auth/Session ────────────────────────► │   (запрос RSA-ключа)
   [2] ◄───────────── 200 {"Alg":"RSA","Key":"MIGf..."} │
               │                                   │
               │        (клиент собирает PEM,       │
               │         шифрует пароль PKCS#1 v1.5) │
               │                                   │
   [3] POST /Auth/Session ──────────────────────► │
               │  {"Name":"Deepseek",               │
               │   "Password":"<base64 RSA>"}       │
   [4] ◄───────────── 200 {"Access":"<jwt1>",        │
               │          "Refresh":"<jwt2>",        │
               │          "Groups":["ADMIN"],        │
               │          "UserName":"Deepseek"}    │
               │                                   │
   [5] GET /Cubes ──────────────────────────────► │
               │  Authorization: <jwt1> (голый)     │
   [6] ◄───────────── 200 {"Cubes":[...]}          │
```

**Ключевые моменты:**
- `[2]` возвращает `Key` в base64 **SPKI DER** (не PEM).
- `[4]` `Access` — это JWT (HS256, claims `iss:"Cubes"`, `sessionid`, `name`).
- `[5]` **без** `Bearer` префикса — иначе 401.
- При 401 в `[5]`/`[6]`: `POST /Auth/Refresh` `{"Refresh": jwt2}` → новые токены.

---

## 6. Обработка ошибок по слоям

| Слой | Что делает с ошибкой |
|---|---|
| `rawFetch` | ловит network/timeout, пробрасывает вверх |
| `requestJson` | не-`ok` статус → `classifyHttpError` → `A1Error` |
| `request` | 401+`AUTH_FAILED` → refresh + retry 1 раз; иначе пробрасывает |
| сервисы | не ловят, пробрасывают `A1Error` вверх |
| обработчик инструмента | неявно пробрасывает; SDK превращает в MCP-ошибку |
| `A1Error.toErrorPayload()` | сериализует `{code, message, httpStatus, endpoint, details, hint}` для клиента |

**`hint`** — важная деталь: агент получает не просто «ошибка», а подсказку
что делать (`NOT_FOUND` → «используй list_* чтобы узнать точное имя»,
`AUTH_FAILED` → «проверь A1_USER/A1_PASSWORD» и т.д.).

---

## 7. Почему так (ключевые решения и находки в процессе разработки)

1. **Голый JWT без `Bearer`.** Обнаружено эмпирически: `Bearer <jwt>`,
   `JWT <jwt>`, `token <jwt>` → 401; голый `<jwt>` → 200. Несмотря на
   документацию, A1 ждёт именно голый токен.

2. **RSA PKCS#1 v1.5, не OAEP.** OAEP = 401; PKCS#1 v1.5 = успех.

3. **`POST /Dimensions` требует `Hierarchies`.** Тело `{Name}` → 500
   «Missing or invalid 'Hierarchies'»; полное тело с (возможно пустым)
   `Hierarchies: [{Name, Elements:[], Edges:[]}]` → 201.

4. **Строковые измерения → строковые значения.** В кубе на `String`-измерении
   запись числа `1` молча не сохраняется (ячейка остаётся пустой), строка
   сохраняется. Учтено в `a1_set_cells` (принимает `Value: number|string`).

5. **Фидеры обязательны для консолидации расчётных ячеек.** Правило
   `Выручка = Цена × Количество` считается на листовых элементах, но
   консолидированный элемент («Все продукты») = 0, пока не добавить фидеры
   `['Мера':'Цена'] => ['Мера':'Выручка'];`.

6. **NativeView требует `[[...]]`.** `POST /Cubes(c)/Views` с `Type:"NativeView"`
   ждёт `Columns`/`Rows` как массив массивов. `MDXView` проще (готовый MDX).

7. **Пиклист static-список** — атрибут создаётся (`POST /Dimensions/Attributes`),
   но знаvalue хранится в кубе `}ElementAttributes_<dim>`, а не через
   `PATCH /Elements` (поле `Attributes` там игнорируется).

---

## 8. Состояние и ограничения (честно)

**Работает (проверено на живом A1):**
- логин (RSA PKCS#1 v1.5) + JWT;
- список/чтение кубов, измерений, элементов, рёбер, подмножеств;
- создание/удаление кубов, измерений, элементов, рёбер, клиентов, групп;
- запись ячеек (`CellSet/Set`), сохранение (`SaveData`);
- правила (`Rule/Get/Set/Check`) + фидеры + трассировка;
- MDX (`ExecMDX`) + консолидация;
- взгляды (`MDXView`), создание/чтение.

**Не проверено / требует доработки:**
- `refresh` (токен не истекал за время тестов) и `logout`;
- `a1_execute_process`, `a1_preview_odbc` (нет тестовых данных);
- picklist static-список;
- `a1_create_client`/`a1_set_client_password` (формат из PDF, не гоняли);
- **readonly/readwrite-гейт отсутствует** — все инструменты регистрируются
  всегда, независимо от `A1_MODE`.

---

## 9. Как это запустить и проверить (кратко)

```bash
cd a1-mcp-server
npm install
npm run build          # tsc → dist/
node dist/index.js     # запуск (stdio)
```

Конфигурация — в `.env` (см. `.env.example`). Подключение к Zed — через
MCP-форма с `Command: node`, `Arguments: D:\Dev\A1-mcp\a1-mcp-server\dist\index.js`
и env-переменными `A1_BASE_URL`, `A1_USER`, `A1_PASSWORD`, `A1_MODE`.

---

Этот документ описывает текущее состояние кода на момент написания. Держать
его в актуальности — задача следующего цикла разработки (по мере закрытия
пунктов из README/Roadmap).
