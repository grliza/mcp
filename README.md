# a1-mcp-server — документация

MCP-сервер для **Платформы А1** (OLAP-система, кубы/измерения/иерархии,
аналогичная IBM TM1 / Planning Analytics). Предоставляет полный жизненный
цикл модели через REST API A1 любому MCP-совместимому LLM-клиенту
(Claude Code, Zed, Claude Desktop и др.).

Проект создан как **адаптация** сервера `tm1-mcp-server` (автор
flameY3T1): архитектура, паттерны (service-классы, zod-схемы, envelope,
пагинация, маскирование секретов) позаимствованы из него, а REST-клиент,
аутентификация и инструменты переписаны под API A1.

---

## 1. Что это и зачем

Платформа А1 — это OLAP-движок с REST API. Её модель данных близка к TM1:

- **Кубы (Cubes)** — многомерные таблицы фактов.
- **Измерения (Dimensions)** — категориальные оси с иерархиями (дерево
  элементов).
- **Элементы (Elements)** — листья (Numeric/String) и консолидации
  (Consolidated).
- **Рёбра (Edges)** — связи «родитель → потомок» с весом.
- **Подмножества (Subsets)** — именованный набор элементов.
- **Взгляды (Views)** — именованные MDX/Native-запросы.
- **Процессы (Processes)** — TurboIntegrator-подобные скрипты.
- **Чоры (Chores)** — расписания процессов.
- **Правила (Rules)** — формулы расчёта ячеек + фидеры.
- **Клиенты/Группы (Clients/Groups)** — безопасность.

Задача сервера — дать LLM-агенту типизированный, безопасный,
подтверждённый доступ ко всему этому через инструменты `a1_*`.

---

## 2. Ключевые отличия от TM1

Эти различия определили объём переписывания:

| Аспект | TM1 (оригинал) | A1 (наш сервер) |
|---|---|---|
| **Аутентификация** | Basic → cookie `TM1SessionId` | JWT: `GET /Auth/Session` (RSA key) → `POST /Auth/Session` (RSA-шифрованный пароль) → `{Access, Refresh}` |
| **Токен в запросах** | `Cookie: TM1SessionId=...` | `Authorization: <голый JWT>` (без `Bearer`!) |
| **URL-ключи** | `/Cubes('name')` | `/Cubes(%22name%22)` — имена в кавычках, percent-encoded |
| **Формат списков** | OData `{"@odata.count", "value":[]}` | Свои обёртки: `{"Cubes":[...]}`, `{"Dimensions":[...]}`, `{"Processes":[...]}` |
| **Правила (Rules)** | `['dim':'elem'] = N: ...;` | `['dim': 'elem'] = N: ...;` + фидеры `=>` |
| **MDX** | `tm1_execute_mdx` (OData cellset) | `POST /ExecMDX` → `{Axes, Cells, Cube}` |
| **Трассировка** | `tm1_trace_cell_calculation` | `POST /Cubes()/TraceCellCalculation` |
| **Задачи** | `threads` (v11) | `GET /Tasks/Stats`, `/Tasks(id)/Move`, `DELETE /Tasks(id)` |

---

## 3. Архитектура

### 3.1 Общая схема

```
MCP-клиент (Zed / Claude Code)
        │  (stdio JSON-RPC)
        ▼
  ┌─────────────────────────┐
  │  src/index.ts           │  точка входа, инициализация, graceful shutdown
  │  (McpServer + register)  │
  └───────────┬─────────────┘
              │
        registerAllTools()
              │
   ┌──────────┴──────────────────────────────┐
   │  src/tools/*.ts  (54 инструмента a1_*)  │  zod-схемы, confirm-гуарды
   └──────────┬──────────────────────────────┘
              │
        A1Client (фасад)
              │
   ┌──────────┴──────────────────────────────┐
   │  src/a1-client/                          │
   │    http.ts        — HTTP + JWT + refresh │
   │    auth.ts        — RSA-шифрование       │
   │    services/*.ts  — доменные сервисы     │
   └──────────┬──────────────────────────────┘
              │  (undici fetch)
              ▼
      Платформа А1 (REST API, http://host:port)
```

### 3.2 Структура каталогов

```
a1-mcp-server/
├── src/
│   ├── index.ts         # точка входа, MCP-сервер, shutdown
│   ├── config.ts        # разбор env (A1_BASE_URL, A1_USER, ...)
│   ├── load-env.ts      # загрузка .env (до того, как что-то импортируется)
│   ├── logger.ts        # pino + маскирование секретов
│   ├── version.ts       # имя/версия из package.json
│   ├── types.ts         # A1Error, коды ошибок, доменные типы
│   ├── a1-client.ts     # фасад A1Client (держит сервисы)
│   ├── a1-client/
│   │   ├── http.ts      # A1HttpClient: JWT, request, refresh, re-auth
│   │   ├── auth.ts      # rsaEncryptPassword (PKCS#1 v1.5)
│   │   └── services/
│   │       ├── cube-service.ts
│   │       ├── dimension-service.ts
│   │       ├── process-service.ts
│   │       ├── chore-service.ts
│   │       ├── security-service.ts
│   │       ├── monitoring-service.ts
│   │       └── mdx-service.ts
│   └── tools/
│       ├── index.ts     # registerAllTools()
│       ├── metadata.ts  # a1_get_server_state
│       ├── cubes.ts     # кубы + правила + view + trace
│       ├── dimensions.ts
│       ├── processes.ts
│       ├── chores.ts
│       ├── security.ts
│       ├── mdx.ts       # MDX + set_cells + save
│       ├── format.ts    # JSON/Markdown-рендер
│       └── error-format.ts
├── dist/                # скомпилированный JS (после build)
├── package.json
├── tsconfig.json
├── .env.example
└── .gitignore
```

### 3.3 Слои и их обязанности

**1. `config.ts` — конфигурация.**
Разбирает переменные окружения `A1_*`, валидирует типы (числовые — строго,
`A1_MODE`/`A1_LOG_LEVEL` — только из whitelist, ошибка при неверном значении).
Требует `A1_BASE_URL`, `A1_USER`, `A1_PASSWORD`.

**2. `a1-client/auth.ts` — RSA-шифрование пароля.**
A1 отдаёт public key (SPKI DER в base64) через `GET /Auth/Session`. Пароль
шифруется **RSA PKCS#1 v1.5** (не OAEP — проверено на живом сервере: OAEP
даёт 401 «Incorrect name or password», PKCS#1 v1.5 проходит), результат —
base64 в поле `Password`.

**3. `a1-client/http.ts` — HTTP-клиент с JWT.**
- Хранит пару `{access, refresh}` в памяти.
- Логин: `GET /Auth/Session` (ключ) → `POST /Auth/Session` (логин).
- Refresh: `POST /Auth/Refresh` `{Refresh}`.
- Re-auth при 401: один refresh, затем повтор запроса.
- **Критично:** `Authorization` = голый JWT без `Bearer` (иначе 401).
- Логирование маскирует токены.

**4. `a1-client/services/*.ts` — доменные сервисы.**
Каждый сервис владеет своей группой эндпоинтов `/Cubes`, `/Dimensions`,
`/Processes`, `/Chores`, `/Clients`/`/Groups`, `/Tasks`, `/ExecMDX`/`/SaveData`.

**5. `src/tools/*.ts` — инструменты MCP.**
Каждый инструмент: имя `a1_*`, описание, zod-схема входных данных,
обработчик (вызывает сервис), обработка ошибок, `confirm`-гуард для
деструктивных операций, JSON/Markdown-рендер результата.

**6. `a1-client.ts` — фасад.**
Держит инстансы сервисов и управляет `connect()`/`disconnect()`.

### 3.4 Жизненный цикл

1. **Старт** (`index.ts` → `main`): `loadConfig()` → `createLogger()` →
   `new A1Client()` → `client.connect()` (логин, не блокирует старт при
   ошибке — retry при первом вызове) → `registerAllTools()` →
   `StdioServerTransport`.
2. **Вызов инструмента:** обработчик → сервис → `http.request()` →
   `ensureSession()` (при необходимости логин) → HTTP-запрос к A1.
3. **401:** `refresh()` → повтор. Если и refresh падает — ошибка `AUTH_FAILED`.
4. **Shutdown:** `SIGINT`/`SIGTERM`/stdin-close → `disconnect()`
   (`DELETE /Auth/Session`) → `process.exit`.

---

## 4. Аутентификация (подробно) — что проверено на живом сервере

Полный подтверждённый handshake:

1. `GET /Auth/Session` → `{"Alg":"RSA","Key":"MIGfMA0...DAQAB"}` (SPKI DER, base64, 1024-бит).
2. Клиент собирает SPKI PEM (`-----BEGIN PUBLIC KEY-----…`), шифрует пароль
   RSA **PKCS#1 v1.5**.
3. `POST /Auth/Session` `{"Name":"Deepseek","Password":"<base64>"}` → `200`
   + `{"Access":"<jwt>","Refresh":"<jwt>","Groups":["ADMIN"],"UserName":"..."}`.
4. Дальше каждый запрос несёт `Authorization: <access-jwt>` (голый).

**Находки (важные):**

- OAEP не поддерживается — только PKCS#1 v1.5.
- `Authorization` без `Bearer`/`JWT`/`token` префикса.
- Первый логин нового юзера возвращал `403` + `"Error":"User must change the password"`
  с валидными токенами, но все запросы давали 401 — потребовалась смена пароля.
- JWT содержит claims: `{exp, iat, iss:"Cubes", name, nbf, sessionid}`.

---

## 5. Инструменты (54 шт.)

Сгруппированы по доменам. «✍» = запись/деструктивное, «🔒» = обязательный
`confirm`-аргумент, остальное — чтение.

### 5.1 Кубы (cubes.ts) — 15
| Инструмент | Описание | Тип |
|---|---|---|
| `a1_list_cubes` | список кубов | чтение |
| `a1_get_cube` | определение куба | чтение |
| `a1_get_cube_rule` | чтение правил | чтение |
| `a1_check_cube_rule` | валидация синтаксиса правил (без сохранения) | чтение |
| `a1_set_cube_rule` | запись правил ✍🔒 | запись |
| `a1_list_cube_views` | список взглядов куба | чтение |
| `a1_get_view` | определение взгляда | чтение |
| `a1_create_view` | создать MDX-взгляд ✍ | запись |
| `a1_delete_view` | удалить взгляд ✍🔒 | запись |
| `a1_trace_cell_calculation` | трассировка расчёта ячейки | чтение |
| `a1_create_cube` | создать куб ✍ | запись |
| `a1_delete_cube` | удалить куб ✍🔒 | запись |
| `a1_create_picklist_cube` | создать picklist-куб ✍ | запись |
| `a1_set_cells` | записать ячейки ✍🔒 | запись |
| `a1_save_data` | сохранить данные ✍ | запись |

### 5.2 Измерения (dimensions.ts) — 14
| Инструмент | Описание | Тип |
|---|---|---|
| `a1_list_dimensions` | список измерений | чтение |
| `a1_get_dimension` | полная структура | чтение |
| `a1_list_dimension_elements` | элементы | чтение |
| `a1_get_dimension_edges` | рёбра | чтение |
| `a1_list_dimension_attributes` | атрибуты | чтение |
| `a1_list_dimension_subsets` | подмножества | чтение |
| `a1_get_dimension_cubes` | кубы, использующие измерение | чтение |
| `a1_get_dimension_max_level` | макс. уровень | чтение |
| `a1_create_dimension` | создать измерение ✍ | запись |
| `a1_delete_dimension` | удалить измерение ✍🔒 | запись |
| `a1_create_element` | создать элементы ✍ | запись |
| `a1_delete_element` | удалить элемент ✍🔒 | запись |
| `a1_set_edges` | установить рёбра ✍ | запись |
| `a1_create_subset` | создать подмножество ✍ | запись |
| `a1_delete_subset` | удалить подмножество ✍🔒 | запись |

### 5.3 Процессы (processes.ts) — 7
| Инструмент | Описание | Тип |
|---|---|---|
| `a1_list_processes` | список процессов | чтение |
| `a1_get_process` | определение процесса | чтение |
| `a1_execute_process` | выполнить ✍🔒 | запись |
| `a1_create_process` | создать ✍ | запись |
| `a1_delete_process` | удалить ✍🔒 | запись |
| `a1_list_odbc_sources` | ODBC-источники | чтение |
| `a1_preview_odbc` | превью SQL ODBC | чтение |

### 5.4 Чоры (chores.ts) — 5
| Инструмент | Описание | Тип |
|---|---|---|
| `a1_list_chores` | список чоров | чтение |
| `a1_get_chore` | определение чора | чтение |
| `a1_activate_chore` | активировать ✍ | запись |
| `a1_deactivate_chore` | деактивировать ✍ | запись |
| `a1_delete_chore` | удалить ✍🔒 | запись |

### 5.5 Безопасность/мониторинг (security.ts) — 11
| Инструмент | Описание | Тип |
|---|---|---|
| `a1_get_client` | клиент + группы | чтение |
| `a1_list_groups` | группы | чтение |
| `a1_list_active_users` | активные пользователи | чтение |
| `a1_list_tasks` | активные задачи | чтение |
| `a1_cancel_task` | отменить задачу ✍🔒 | запись |
| `a1_create_client` | создать клиента ✍ | запись |
| `a1_delete_client` | удалить клиента ✍🔒 | запись |
| `a1_set_client_password` | сменить пароль ✍ | запись |
| `a1_create_group` | создать группу ✍ | запись |
| `a1_delete_group` | удалить группу ✍🔒 | запись |

### 5.6 MDX (mdx.ts) — 2
| Инструмент | Описание | Тип |
|---|---|---|
| `a1_execute_mdx` | выполнить MDX | чтение |
| `a1_set_cells` (дубль см. кубы) | — | — |

> Примечание: `a1_set_cells` и `a1_save_data` фактически зарегистрированы в
> `mdx.ts`, а `a1_set_cube_rule`/`a1_set_cells` логически относятся к кубам.
> Итоговое число уникальных инструментов — **54**.

### 5.7 Метаданные (metadata.ts) — 1
| Инструмент | Описание | Тип |
|---|---|---|
| `a1_get_server_state` | состояние + счётчики объектов | чтение |

---

## 6. Что протестировано (на живом сервере A1)

| Функция | Статус | Примечание |
|---|---|---|
| RSA-логин (PKCS#1 v1.5) | ✅ | подтверждено на `127.0.0.1:7781` |
| JWT auth (голый токен) | ✅ | `Authorization: <jwt>` без префикса |
| Refresh | ⚠️ не проверен | логика есть, но истечение Access не воспроизводили |
| Logout (`DELETE /Auth/Session`) | ⚠️ не проверен | вызывается при shutdown |
| `a1_list_cubes` / `a1_list_dimensions` | ✅ | данные читаются |
| `a1_create_dimension` | ✅ | требует `Hierarchies` (иначе 500) |
| `a1_create_element` | ✅ | `{Elements:[{Name,Type}]}` → 200 |
| `a1_set_edges` | ✅ | консолидация работает |
| `a1_create_cube` | ✅ | `{Name, Dimensions:[...]}` → 201 |
| `a1_set_cells` (числов. куб) | ✅ | «Финансы» |
| `a1_set_cells` (строк. куб) | ✅ | строка сохраняется; число — нет |
| `a1_set_cube_rule` + фидеры | ✅ | `Выручка = Цена × Количество` считается |
| `a1_trace_cell_calculation` | ✅ | возвращает декомпозицию |
| `a1_execute_mdx` | ✅ | сводка с консолидацией |
| `a1_create_view` (MDXView) | ✅ | 201; NativeView требует `[[...]]` |
| `a1_create_client` | ⚠️ не проверен | формат из PDF, тело не пробовали |
| `a1_set_client_password` | ⚠️ не проверен | — |
| `a1_execute_process` | ⚠️ не проверен | нет тестового процесса |
| `a1_preview_odbc` | ⚠️ не проверен | нет ODBC-источника |
| Консолидация `Счётчик` (1..100) | ⚠️ не проверен итог | иерархия создана, сумма не проверялась |
| Picklist static-список | ❌ не до конца | атрибут создаётся, но static-значение требует записи в `}ElementAttributes_...` куб |

---

## 7. Известные проблемы и что надо поправить

### 7.1 Критичные / требующие внимания

1. **Readonly/readwrite-гейт отсутствует.**
   В отличие от `tm1-mcp-server`, у `A1_MODE=readonly` **нет** фактического
   эффекта — все 54 инструмента (включая write/destructive) регистрируются
   всегда. `config.ts` парсит `A1_MODE`, но `tools/index.ts` его не использует
   для фильтрации.
   → Нужно: добавить фильтрацию по `A1_MODE` (как `withAnnotations` в оригинале).
   → Критично для безопасности, если сервер намерены шарить.

2. **Refresh/keep-alive не протестированы.**
   Логика refresh есть, но не подтверждена на живом сервере (Access-токен не
   истекал за время тестов). Рекомендуется тест с коротким `exp`.

3. **Постоянное подключение при старте.**
   `index.ts` вызывает `client.connect()` при каждом старте (логин к A1 сразу
   при открытии Zed). Это создаёт сессию, даже если инструменты не вызывались.
   → Опционально: перейти на ленивый логин (только при первом вызове).

### 7.2 Средние / желательно

4. **`a1_create_subset` / `a1_delete_subset` не протестированы на живом сервере.**
   Формат взят из PDF (`POST /Dimensions(d)/Subsets(name)` с телом
   `{Name, Dimension, Alias, Elements}`), но end-to-end не проверен.

5. **`a1_create_attribute` отсутствует.**
   Атрибуты (`PickList` и др.) создавались через прямой REST-запрос
   (`POST /Dimensions(d)/Attributes(name,type)`), но инструмента `a1_create_attribute`
   и `a1_delete_attribute` нет в наборе. Стоит добавить.

6. **Picklist static-список не реализован.**
   Создан атрибут `PickList` (тип String), но сам static-список значений
   (`static:'A','B','C'`) не задан. Выяснено: значение атрибута **не**
   сохраняется через `PATCH /Elements` (поле `Attributes` игнорируется),
   а хранится в отдельном кубе `}ElementAttributes_<dim>` — нужен CellSet-write
   в этот куб. Требует доработки.

7. **Формат NativeView требует вложенных массивов.**
   `POST /Cubes(c)/Views` с `Type:"NativeView"` ожидает `Columns`/`Rows` как
   `[[{...}]]` (массив массивов), а не плоский массив. `MDXView` работает проще.
   Инструмент `a1_create_view` реализован только для MDXView.

### 7.3 Косметика / наблюдения

8. **Строковые измерения требуют строковые значения.**
   В кубе на `String`-типах измерений запись числа `1` молча не сохраняется
   (ячейка остаётся пустой), строка — сохраняется. Это семантика A1, но стоит
   документировать/учесть в `a1_set_cells`.

9. **Нет отдельного `a1_create_attribute`/`a1_delete_attribute`.**
   (см. п.5)

10. **`a1_list_cube_views` возвращает `{Views:[{Name,Type}]}`**, но каноничный
   `a1_list_cube_views` в `cubes.ts` использует `listViewNames()`, а не полный
   список. Небольшая непоследовательность имён.

---

## 8. Как запускать

### 8.1 Требования
- Node.js **>= 22.19** (проверено на v24.21.0).
- Доступ до сервера A1 по HTTP(S).

### 8.2 Установка и сборка

```bash
cd a1-mcp-server
npm install        # зависимости + сборка (tsc → dist/)
npm run build      # пересобрать вручную
```

### 8.3 Конфигурация (`.env`)

```env
A1_BASE_URL=http://127.0.0.1:7781
A1_USER=Deepseek
A1_PASSWORD=Deepseek
A1_MODE=readonly          # readonly (default) | readwrite
A1_LOG_LEVEL=info
# A1_LOG_FILE=/path/to/a1.log
# A1_SSL_REJECT_UNAUTHORIZED=false   # self-signed dev certs only
# A1_MCP_TRANSPORT=http             # stdio по умолчанию
```

### 8.4 Запуск

```bash
node dist/index.js       # или: npm start
npm run dev              # tsx (live-reload)
```

### 8.5 Подключение к Zed

В настройках MCP-серверов Zed:

| Поле | Значение |
|---|---|
| Name | `a1` |
| Command | `node` |
| Arguments | `D:\Dev\A1-mcp\a1-mcp-server\dist\index.js` |
| Env | `A1_BASE_URL=http://127.0.0.1:7781`, `A1_USER=Deepseek`, `A1_PASSWORD=...`, `A1_MODE=readwrite` |

После изменения кода — пересобрать (`npm run build`) и **перезапустить Zed**
(MCP-сервер спавнится только при старте).

---

## 9. Что построено в модели A1 (результаты демо)

В ходе разработки на живом сервере построена тестовая модель:

**Измерения:** `Счётчик` (100 элем. + иерархия Total10..GrandTotal),
`Инструменты` (54 инструмента), `Статус` (Реализовано/Запланировано/
Отложено + атрибут PickList), `Меры`, `МСР реализация`, `Продукт`, `Месяц`.

**Кубы:**
- `Тест ИИ` = `[Инструменты × Статус]` — трекер статусов (широкий формат).
- `МСР_Реализация` = `[Счётчик × МСР реализация]` — long-table трекер.
- `Финансы` = `[Продукт × Мера × Месяц]` — с правилом `Выручка = Цена × Количество`,
  фидерами и иерархиями `Все продукты`/`Квартал1`.

**Взгляд:** `Красивый отчёт` (MDXView) на кубе «Финансы».

---

## 10. Демо-сценарий (для созвона)

1. **Логин + список** — `a1_list_cubes`, `a1_list_dimensions` (показать живое
   подключение через JWT).
2. **Живой расчёт** — показать куб «Финансы»: правило `Выручка = Цена ×
   Количество` посчитало все ячейки; `a1_trace_cell_calculation` раскладывает
   «почему 800 000 = 80 000 × 10».
3. **Консолидация** — `a1_execute_mdx` со сводкой по `Все продукты × Квартал1`
   (итог 8 474 000).
4. **Взгляд** — `a1_get_view` «Красивый отчёт».
5. **Трекер** — `a1_execute_mdx` по кубу «Тест ИИ» (54 инструмента × статусы).

---

## 11. Roadmap

**Ближайшее:**
- [ ] Добавить readonly/readwrite-гейт (критично).
- [ ] Добавить `a1_create_attribute` / `a1_delete_attribute`.
- [ ] Добить picklist static-список.
- [ ] Протестировать refresh/keep-alive, logout, create_client, execute_process.
- [ ] Ленивый логин (опционально).

**Дальше:**
- [ ] Полный `a1_create_view` для NativeView (вложенные массивы).
- [ ] Аннотации (`/Annotations`) — отдельный домен.
- [ ] File-upload (`/Processes/Files`, multipart).
- [ ] Промпты и resources (как в tm1-mcp-server).
- [ ] HTTP-транспорт (сейчас только stdio).

---

## 12. Прочее

- **Лицензия/происхождение:** исходный `tm1-mcp-server` — MIT, автор
  flameY3T1. Наш `a1-mcp-server` — адаптация под A1.
- **Безопасность:** секреты (пароль, токены) маскируются в логах через pino
  redact. `confirm`-гуарды на деструктивных инструментах.
- **Торговые марки:** IBM, Planning Analytics, TM1 — марки IBM Corp. Проект
  не аффилирован ни с IBM, ни с производителем A1.
