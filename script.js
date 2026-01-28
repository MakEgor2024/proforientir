// --- Proforientir JavaScript (v16 - Final Production Build) ---

// --- Константы и Переменные ---
const HOLLAND_TYPES = { REALISTIC: 'realistic', INVESTIGATIVE: 'investigative', ARTISTIC: 'artistic', SOCIAL: 'social', ENTERPRISING: 'enterprising', CONVENTIONAL: 'conventional' };
const TYPE_DESCRIPTIONS = {
    [HOLLAND_TYPES.REALISTIC]: { name: "Реалистичный", description: "Вам нравится работать руками, с инструментами, техникой, животными или растениями. Вы цените практичность и конкретные результаты.", explanation: "Это указывает на склонность к инженерным, техническим, природным или ремесленным областям." },
    [HOLLAND_TYPES.INVESTIGATIVE]: { name: "Исследовательский", description: "Вас привлекает анализ информации, решение сложных задач, научные исследования. Вы любознательны и любите разбираться в сути вещей.", explanation: "Это говорит об интересе к научной, аналитической, медицинской или IT-деятельности, где важен поиск знаний." },
    [HOLLAND_TYPES.ARTISTIC]: { name: "Артистический", description: "Вам нравится творческое самовыражение через искусство, музыку, дизайн, литературу. Вы цените оригинальность и эстетику.", explanation: "Это указывает на ваш творческий потенциал и интерес к сферам дизайна, искусства, медиа и гуманитарных наук." },
    [HOLLAND_TYPES.SOCIAL]: { name: "Социальный", description: "Вы любите работать с людьми, помогать, обучать, консультировать. Вам важны общение и взаимопонимание.", explanation: "Это говорит о вашей ориентации на помощь людям, что важно в педагогике, медицине, психологии и социальной работе." },
    [HOLLAND_TYPES.ENTERPRISING]: { name: "Предприимчивый", description: "Вас привлекает возможность руководить, убеждать, организовывать проекты, влиять на людей. Вы амбициозны и инициативны.", explanation: "Это указывает на лидерские качества и интерес к бизнесу, управлению, продажам, юриспруденции и политике." },
    [HOLLAND_TYPES.CONVENTIONAL]: { name: "Конвенциональный", description: "Вам нравится работать с информацией, данными, документами, следовать инструкциям. Вы цените порядок, точность и системность.", explanation: "Это говорит о вашей склонности к работе, требующей внимательности и организованности, например, в финансах, администрировании, IT (данные)." }
};
const UNI_TYPE_ICONS = { science: 'flask-conical', tech: 'cpu', engineering: 'wrench', international: 'globe-2', economics: 'trending-up', medical: 'stethoscope', management: 'users', art: 'palette', law: 'scale', humanities: 'book-open', education: 'graduation-cap', social: 'heart-handshake', agriculture: 'tractor', architecture: 'landmark', finance: 'banknote', default: 'building-2', transport: 'truck', communications: 'wifi', pedagogy: 'book-user', psychology: 'brain', food: 'chef-hat', chemical: 'flask-conical', geodesy: 'map-pin', music: 'music', cinema: 'film', literature: 'book-text', aviation: 'plane', civil_engineering: 'building' };

// --- РАСШИРЕННАЯ БАЗА ДАННЫХ ПРОФЕССИЙ (загружается из professions.json) ---
let professions = [];

async function loadProfessions() {
    try {
        const response = await fetch('professions.json');
        if (!response.ok) throw new Error('Failed to load professions.json');
        const professionsData = await response.json();
        professions = professionsData.map(prof => ({
            ...prof,
            types: prof.types.map(t => HOLLAND_TYPES[t.toUpperCase()] || t)
        }));
        renderProfessions();
    } catch (error) {
        console.error("Error loading professions:", error);
        showToast("Ошибка при загрузке данных профессий.");
    }
}

// Старые данные профессий (удалены из-за миграции в JSON)
/*const professions = [
    { name: "Адвокат", description: "Защищает права и интересы граждан и организаций в суде.", types: [HOLLAND_TYPES.ENTERPRISING, HOLLAND_TYPES.SOCIAL, HOLLAND_TYPES.INVESTIGATIVE], keywords: ["юриспруденция", "право", "суд", "защита", "адвокатура"] },
    { name: "Авиаконструктор", description: "Разрабатывает и проектирует самолеты, вертолеты и другие летательные аппараты.", types: [HOLLAND_TYPES.INVESTIGATIVE, HOLLAND_TYPES.REALISTIC], keywords: ["авиация", "самолеты", "инженер", "конструирование", "аэрокосмос"] },
    { name: "Агроном", description: "Разрабатывает технологии выращивания с/х культур. Контролирует качество урожая.", types: [HOLLAND_TYPES.REALISTIC, HOLLAND_TYPES.INVESTIGATIVE], keywords: ["сельское хозяйство", "растениеводство", "биология", "агрономия", "почвоведение"] },
    { name: "Актёр", description: "Играет роли в театре и кино. Перевоплощается в разных персонажей.", types: [HOLLAND_TYPES.ARTISTIC, HOLLAND_TYPES.SOCIAL], keywords: ["театр", "кино", "искусство", "сцена", "актерское мастерство"] },
    { name: "Аналитик данных (Data Scientist)", description: "Исследует большие объемы данных, строит модели, выявляет закономерности.", types: [HOLLAND_TYPES.INVESTIGATIVE, HOLLAND_TYPES.CONVENTIONAL], keywords: ["data science", "big data", "статистика", "программирование", "анализ", "машинное обучение", "python"] },
    { name: "Архитектор", description: "Проектирует здания и сооружения. Разрабатывает планировку и дизайн.", types: [HOLLAND_TYPES.ARTISTIC, HOLLAND_TYPES.REALISTIC, HOLLAND_TYPES.INVESTIGATIVE], keywords: ["архитектура", "строительство", "проектирование", "дизайн", "черчение", "градостроительство"] },
    { name: "Астрофизик", description: "Изучает физические процессы, происходящие в космосе, звезды, галактики.", types: [HOLLAND_TYPES.INVESTIGATIVE], keywords: ["астрономия", "физика", "космос", "наука", "исследование"] },
    { name: "Аудитор", description: "Проверяет финансовую отчетность компаний на достоверность и соответствие законам.", types: [HOLLAND_TYPES.CONVENTIONAL, HOLLAND_TYPES.INVESTIGATIVE, HOLLAND_TYPES.ENTERPRISING], keywords: ["аудит", "бухгалтерский учет", "финансы", "проверка", "отчетность", "экономика"] },
    { name: "Библиотекарь-архивист", description: "Систематизирует, хранит и выдает книги, документы и другие источники информации.", types: [HOLLAND_TYPES.CONVENTIONAL, HOLLAND_TYPES.SOCIAL], keywords: ["библиотека", "архив", "документы", "книги", "информация"] },
    { name: "Биоинженер", description: "Применяет инженерные принципы к биологическим системам, разрабатывает биотехнологии.", types: [HOLLAND_TYPES.INVESTIGATIVE, HOLLAND_TYPES.REALISTIC], keywords: ["биология", "генная инженерия", "медицина", "технологии", "биотехнология", "биомедицина"] },
    { name: "Бизнес-аналитик", description: "Изучает потребности бизнеса и предлагает решения для улучшения процессов и систем.", types: [HOLLAND_TYPES.INVESTIGATIVE, HOLLAND_TYPES.ENTERPRISING, HOLLAND_TYPES.CONVENTIONAL], keywords: ["бизнес-анализ", "it", "требования", "аналитика", "консалтинг"] },
    { name: "Веб-разработчик", description: "Создает и поддерживает веб-сайты и веб-приложения.", types: [HOLLAND_TYPES.INVESTIGATIVE, HOLLAND_TYPES.REALISTIC, HOLLAND_TYPES.CONVENTIONAL], keywords: ["программирование", "html", "css", "javascript", "it", "веб", "frontend", "backend"] },
    { name: "Ветеринар", description: "Лечит животных, проводит профилактику заболеваний и консультирует владельцев.", types: [HOLLAND_TYPES.REALISTIC, HOLLAND_TYPES.SOCIAL, HOLLAND_TYPES.INVESTIGATIVE], keywords: ["ветеринария", "животные", "медицина", "лечение"] },
    { name: "Вирусолог", description: "Изучает вирусы и разрабатывает методы борьбы с вирусными заболеваниями.", types: [HOLLAND_TYPES.INVESTIGATIVE], keywords: ["вирусология", "микробиология", "медицина", "эпидемиология", "наука"] },
    { name: "Врач", description: "Диагностирует, лечит и предотвращает заболевания у людей.", types: [HOLLAND_TYPES.INVESTIGATIVE, HOLLAND_TYPES.SOCIAL, HOLLAND_TYPES.REALISTIC], keywords: ["медицина", "здравоохранение", "лечение", "биология", "лечебное дело", "педиатрия", "стоматология", "хирургия"] },
    { name: "Генетик", description: "Изучает гены, наследственность и изменчивость организмов.", types: [HOLLAND_TYPES.INVESTIGATIVE], keywords: ["генетика", "биология", "днк", "наследственность", "медицина", "исследование"] },
    { name: "Геодезист", description: "Выполняет измерения на местности для создания карт и планов, сопровождает строительство.", types: [HOLLAND_TYPES.REALISTIC, HOLLAND_TYPES.CONVENTIONAL, HOLLAND_TYPES.INVESTIGATIVE], keywords: ["геодезия", "картография", "измерения", "строительство", "топография"] },
    { name: "Графический дизайнер", description: "Создает визуальные решения, логотипы, брендинг и рекламные материалы.", types: [HOLLAND_TYPES.ARTISTIC, HOLLAND_TYPES.REALISTIC], keywords: ["дизайн", "графика", "иллюстрация", "реклама", "photoshop", "illustrator", "визуальные коммуникации"] },
    { name: "DevOps инженер", description: "Автоматизирует процессы разработки, тестирования и развертывания ПО.", types: [HOLLAND_TYPES.REALISTIC, HOLLAND_TYPES.INVESTIGATIVE, HOLLAND_TYPES.CONVENTIONAL], keywords: ["devops", "ci/cd", "автоматизация", "облачные технологии", "it", "программирование"] },
    { name: "Дизайнер интерьера", description: "Создает функциональные и эстетичные пространства внутри помещений.", types: [HOLLAND_TYPES.ARTISTIC, HOLLAND_TYPES.REALISTIC, HOLLAND_TYPES.ENTERPRISING], keywords: ["дизайн интерьера", "декор", "ремонт", "проектирование"] },
    { name: "Журналист", description: "Собирает, обрабатывает и распространяет информацию через СМИ. Пишет статьи, репортажи.", types: [HOLLAND_TYPES.ARTISTIC, HOLLAND_TYPES.SOCIAL, HOLLAND_TYPES.ENTERPRISING], keywords: ["журналистика", "сми", "медиа", "репортаж", "статья", "тексты"] },
    { name: "Звукорежиссер", description: "Работает со звуком в кино, на радио, телевидении и в музыкальной индустрии.", types: [HOLLAND_TYPES.ARTISTIC, HOLLAND_TYPES.REALISTIC], keywords: ["звук", "музыка", "аудио", "саунд-дизайн", "запись"] },
    { name: "Инженер-механик", description: "Проектирует, конструирует и эксплуатирует механическое оборудование и машины.", types: [HOLLAND_TYPES.REALISTIC, HOLLAND_TYPES.INVESTIGATIVE], keywords: ["инженер", "механика", "машиностроение", "конструирование"] },
    { name: "Инженер-программист (Software Engineer)", description: "Разрабатывает программное обеспечение, алгоритмы, тестирует код.", types: [HOLLAND_TYPES.INVESTIGATIVE, HOLLAND_TYPES.REALISTIC], keywords: ["программирование", "разработка по", "it", "технологии", "кодинг", "java", "c++", "python"] },
    { name: "Инженер-строитель", description: "Проектирует, возводит и эксплуатирует здания и сооружения.", types: [HOLLAND_TYPES.REALISTIC, HOLLAND_TYPES.CONVENTIONAL, HOLLAND_TYPES.ENTERPRISING], keywords: ["строительство", "инженер", "пгс", "проектирование", "здания"] },
    { name: "Инженер-электроник", description: "Разрабатывает, проектирует и обслуживает электронные устройства, схемы и системы.", types: [HOLLAND_TYPES.INVESTIGATIVE, HOLLAND_TYPES.REALISTIC], keywords: ["электроника", "схемотехника", "микроэлектроника", "приборостроение", "радиотехника"] },
    { name: "Инженер по автоматизации (АСУ ТП)", description: "Разрабатывает и внедряет системы автоматического управления технологическими процессами.", types: [HOLLAND_TYPES.REALISTIC, HOLLAND_TYPES.INVESTIGATIVE], keywords: ["асу тп", "автоматизация", "программирование", "плк", "инженер"] },
    { name: "Искусствовед", description: "Изучает историю и теорию изобразительного искусства, курирует выставки.", types: [HOLLAND_TYPES.ARTISTIC, HOLLAND_TYPES.INVESTIGATIVE], keywords: ["искусствоведение", "история искусств", "музей", "выставка", "критика", "арт-рынок"] },
    { name: "Историк", description: "Изучает прошлое человечества на основе источников. Работает в науке, образовании, архивах.", types: [HOLLAND_TYPES.INVESTIGATIVE, HOLLAND_TYPES.ARTISTIC], keywords: ["история", "архив", "исследование", "археология", "прошлое"] },
    { name: "IT-специалист по связи", description: "Проектирует, настраивает и обслуживает телекоммуникационные системы и сети.", types: [HOLLAND_TYPES.REALISTIC, HOLLAND_TYPES.INVESTIGATIVE], keywords: ["связь", "телекоммуникации", "сети", "it", "информационные технологии"] },
    { name: "Картограф", description: "Создает и обновляет географические, топографические и другие карты.", types: [HOLLAND_TYPES.CONVENTIONAL, HOLLAND_TYPES.INVESTIGATIVE, HOLLAND_TYPES.REALISTIC], keywords: ["картография", "география", "гис", "карты", "геодезия"] },
    { name: "Культуролог", description: "Изучает культуру как систему, ее развитие и взаимодействие различных культур.", types: [HOLLAND_TYPES.INVESTIGATIVE, HOLLAND_TYPES.ARTISTIC], keywords: ["культурология", "культура", "искусство", "общество", "антропология"] },
    { name: "Ландшафтный дизайнер", description: "Проектирует и озеленяет сады, парки и другие открытые пространства.", types: [HOLLAND_TYPES.ARTISTIC, HOLLAND_TYPES.REALISTIC], keywords: ["ландшафтный дизайн", "озеленение", "растения", "архитектура"] },
    { name: "Литературный работник", description: "Создает художественные, публицистические или научные тексты.", types: [HOLLAND_TYPES.ARTISTIC, HOLLAND_TYPES.INVESTIGATIVE], keywords: ["литература", "писательство", "поэзия", "критика", "филология", "журналистика", "редактор"] },
    { name: "Логист", description: "Организует и управляет потоками товаров, информации и финансов.", types: [HOLLAND_TYPES.CONVENTIONAL, HOLLAND_TYPES.ENTERPRISING], keywords: ["логистика", "транспорт", "склад", "цепи поставок", "менеджмент"] },
    { name: "Маркетолог", description: "Исследует рынок, разрабатывает и реализует стратегии продвижения товаров и услуг.", types: [HOLLAND_TYPES.ENTERPRISING, HOLLAND_TYPES.SOCIAL, HOLLAND_TYPES.INVESTIGATIVE], keywords: ["маркетинг", "реклама", "продажи", "анализ рынка", "pr", "smm"] },
    { name: "Менеджер проектов", description: "Планирует, организует и контролирует выполнение проектов.", types: [HOLLAND_TYPES.ENTERPRISING, HOLLAND_TYPES.CONVENTIONAL, HOLLAND_TYPES.SOCIAL], keywords: ["управление проектами", "менеджмент", "организация", "планирование", "бизнес"] },
    { name: "Метеоролог", description: "Изучает атмосферные явления и составляет прогнозы погоды.", types: [HOLLAND_TYPES.INVESTIGATIVE], keywords: ["метеорология", "погода", "климат", "наука", "прогноз"] },
    { name: "Музыкант", description: "Создает или исполняет музыкальные произведения.", types: [HOLLAND_TYPES.ARTISTIC, HOLLAND_TYPES.SOCIAL], keywords: ["музыка", "исполнительство", "композиция", "дирижирование", "искусство"] },
    { name: "Переводчик", description: "Переводит устную и письменную речь с одного языка на другой.", types: [HOLLAND_TYPES.ARTISTIC, HOLLAND_TYPES.SOCIAL, HOLLAND_TYPES.CONVENTIONAL], keywords: ["лингвистика", "иностранные языки", "филология", "перевод"] },
    { name: "Пилот гражданской авиации", description: "Управляет пассажирскими или грузовыми самолетами.", types: [HOLLAND_TYPES.REALISTIC, HOLLAND_TYPES.CONVENTIONAL], keywords: ["авиация", "пилот", "самолет", "транспорт"] },
    { name: "Пищевой технолог", description: "Разрабатывает рецептуры и технологии производства пищевых продуктов.", types: [HOLLAND_TYPES.REALISTIC, HOLLAND_TYPES.INVESTIGATIVE], keywords: ["пищевая промышленность", "технология", "продукты питания", "качество"] },
    { name: "Политолог", description: "Анализирует политические процессы, системы и международные отношения.", types: [HOLLAND_TYPES.INVESTIGATIVE, HOLLAND_TYPES.ENTERPRISING], keywords: ["политика", "государство", "международные отношения", "анализ"] },
    { name: "Предприниматель", description: "Создает и управляет собственным бизнесом, принимая на себя риски.", types: [HOLLAND_TYPES.ENTERPRISING, HOLLAND_TYPES.REALISTIC, HOLLAND_TYPES.CONVENTIONAL], keywords: ["бизнес", "стартап", "управление", "предпринимательство"] },
    { name: "Продакт-менеджер", description: "Отвечает за создание и развитие продукта, от идеи до вывода на рынок.", types: [HOLLAND_TYPES.ENTERPRISING, HOLLAND_TYPES.INVESTIGATIVE, HOLLAND_TYPES.SOCIAL], keywords: ["product management", "it", "бизнес", "продукт", "менеджмент"] },
    { name: "Психолог", description: "Помогает людям справляться с эмоциональными и психологическими проблемами.", types: [HOLLAND_TYPES.SOCIAL, HOLLAND_TYPES.INVESTIGATIVE], keywords: ["психология", "консультирование", "социальная работа", "терапия", "клиническая психология"] },
    { name: "Разработчик мобильных приложений", description: "Создает приложения для смартфонов и планшетов на iOS и Android.", types: [HOLLAND_TYPES.INVESTIGATIVE, HOLLAND_TYPES.REALISTIC, HOLLAND_TYPES.ARTISTIC], keywords: ["mobile", "ios", "android", "swift", "kotlin", "программирование", "it"] },
    { name: "Режиссер кино и телевидения", description: "Руководит творческим процессом создания фильмов, телепередач, клипов.", types: [HOLLAND_TYPES.ARTISTIC, HOLLAND_TYPES.ENTERPRISING], keywords: ["кино", "телевидение", "режиссура", "искусство", "съемки", "сценарий"] },
    { name: "Риэлтор", description: "Помогает людям покупать, продавать или арендовать недвижимость.", types: [HOLLAND_TYPES.ENTERPRISING, HOLLAND_TYPES.SOCIAL], keywords: ["недвижимость", "продажи", "переговоры", "риэлтор"] },
    { name: "Сетевой инженер", description: "Проектирует, настраивает и поддерживает компьютерные сети в организациях.", types: [HOLLAND_TYPES.REALISTIC, HOLLAND_TYPES.CONVENTIONAL], keywords: ["сети", "cisco", "network", "it", "администрирование"] },
    { name: "Системный аналитик", description: "Анализирует бизнес-процессы и проектирует информационные системы для их автоматизации.", types: [HOLLAND_TYPES.INVESTIGATIVE, HOLLAND_TYPES.CONVENTIONAL], keywords: ["системный анализ", "it", "бизнес-анализ", "требования", "проектирование ис"] },
    { name: "Социолог", description: "Изучает общество, социальные явления и поведение людей с помощью опросов и анализа данных.", types: [HOLLAND_TYPES.INVESTIGATIVE, HOLLAND_TYPES.SOCIAL], keywords: ["социология", "общество", "исследование", "анализ", "опросы"] },
    { name: "Социальный работник", description: "Оказывает помощь и поддержку людям, оказавшимся в трудной жизненной ситуации.", types: [HOLLAND_TYPES.SOCIAL], keywords: ["социальная работа", "помощь", "поддержка", "общество"] },
    { name: "Специалист по кибербезопасности", description: "Защищает компьютерные системы и сети от кибератак, анализирует уязвимости.", types: [HOLLAND_TYPES.INVESTIGATIVE, HOLLAND_TYPES.CONVENTIONAL], keywords: ["кибербезопасность", "информационная безопасность", "сети", "защита данных", "it"] },
    { name: "Тренер (спортивный)", description: "Обучает спортсменов технике, тактике, развивает их физические и психологические качества.", types: [HOLLAND_TYPES.SOCIAL, HOLLAND_TYPES.REALISTIC, HOLLAND_TYPES.ENTERPRISING], keywords: ["спорт", "тренировки", "физкультура", "педагогика"] },
    { name: "Учитель / Преподаватель", description: "Преподает предметы в школе или вузе. Помогает ученикам усваивать знания.", types: [HOLLAND_TYPES.SOCIAL, HOLLAND_TYPES.ARTISTIC], keywords: ["педагогика", "образование", "обучение", "преподавание"] },
    { name: "UX/UI дизайнер", description: "Проектирует пользовательские интерфейсы, делая их удобными и понятными.", types: [HOLLAND_TYPES.ARTISTIC, HOLLAND_TYPES.INVESTIGATIVE, HOLLAND_TYPES.SOCIAL], keywords: ["ux", "ui", "дизайн", "интерфейс", "проектирование", "юзабилити", "it"] },
    { name: "Фармацевт", description: "Работает в аптеке, консультирует по лекарственным препаратам.", types: [HOLLAND_TYPES.CONVENTIONAL, HOLLAND_TYPES.SOCIAL, HOLLAND_TYPES.INVESTIGATIVE], keywords: ["фармация", "лекарства", "аптека", "химия", "медицина"] },
    { name: "Финансовый аналитик", description: "Анализирует финансовые рынки, инвестиции, составляет прогнозы.", types: [HOLLAND_TYPES.INVESTIGATIVE, HOLLAND_TYPES.ENTERPRISING, HOLLAND_TYPES.CONVENTIONAL], keywords: ["финансы", "экономика", "инвестиции", "анализ", "банкинг"] },
    { name: "Фотограф", description: "Создает художественные и документальные фотографии.", types: [HOLLAND_TYPES.ARTISTIC, HOLLAND_TYPES.REALISTIC], keywords: ["фотография", "искусство", "репортаж", "студия"] },
    { name: "Химик-технолог", description: "Разрабатывает и внедряет химические процессы в производство.", types: [HOLLAND_TYPES.INVESTIGATIVE, HOLLAND_TYPES.REALISTIC], keywords: ["химия", "технология", "производство", "лаборатория", "химическая технология"] },
    { name: "HR-менеджер", description: "Управляет персоналом компании: нанимает, адаптирует, обучает и мотивирует.", types: [HOLLAND_TYPES.SOCIAL, HOLLAND_TYPES.ENTERPRISING], keywords: ["hr", "управление персоналом", "рекрутинг", "кадры", "менеджмент"] },
    { name: "Эколог", description: "Изучает взаимодействие живых организмов и среды, решает проблемы охраны природы.", types: [HOLLAND_TYPES.INVESTIGATIVE, HOLLAND_TYPES.REALISTIC, HOLLAND_TYPES.SOCIAL], keywords: ["экология", "охрана природы", "биология", "география", "техносферная безопасность"] },
    { name: "Экономист", description: "Анализирует экономические процессы. Прогнозирует развитие рынка и бюджета.", types: [HOLLAND_TYPES.INVESTIGATIVE, HOLLAND_TYPES.ENTERPRISING, HOLLAND_TYPES.CONVENTIONAL], keywords: ["экономика", "финансы", "анализ", "статистика", "бухгалтерский учет"] },
    { name: "Event-менеджер", description: "Организует мероприятия: от конференций и выставок до праздников и свадеб.", types: [HOLLAND_TYPES.ENTERPRISING, HOLLAND_TYPES.SOCIAL, HOLLAND_TYPES.CONVENTIONAL], keywords: ["event", "мероприятия", "организация", "праздник", "менеджмент"] },
    { name: "AI/ML инженер", description: "Разрабатывает и обучает модели искусственного интеллекта и машинного обучения.", types: [HOLLAND_TYPES.INVESTIGATIVE], keywords: ["ai", "ml", "искусственный интеллект", "машинное обучение", "python", "нейросети"] },
    { name: "Motion-дизайнер", description: "Создает анимированную графику для видео, рекламы, сайтов и приложений.", types: [HOLLAND_TYPES.ARTISTIC], keywords: ["motion design", "анимация", "after effects", "видео", "дизайн"] },
    { name: "QA инженер (Тестировщик ПО)", description: "Ищет ошибки и уязвимости в программном обеспечении перед его выпуском.", types: [HOLLAND_TYPES.CONVENTIONAL, HOLLAND_TYPES.INVESTIGATIVE], keywords: ["qa", "тестирование", "it", "качество", "автотесты"] }
];
*/

// --- РАСШИРЕННАЯ И АКТУАЛИЗИРОВАННАЯ БАЗА ВУЗОВ МОСКВЫ ---
let universities = [];

async function loadUniversities() {
    try {
        const response = await fetch('universities.json');
        if (!response.ok) throw new Error('Failed to load universities.json');
        universities = await response.json();
        processUniversityData();
        renderUniversities();
        populateUniFilterOptions();
    } catch (error) {
        console.error("Error loading universities:", error);
        showToast("Ошибка при загрузке данных университетов.");
    }
}

// --- Данные для теста (без изменений) ---
const testQuestions = [
    { question: "1. Какая деятельность доставляет вам больше удовольствия?", options: [ { text: "Чинить или собирать механизмы, работать с инструментами", types: [HOLLAND_TYPES.REALISTIC] }, { text: "Читать научные статьи, проводить исследования, анализировать данные", types: [HOLLAND_TYPES.INVESTIGATIVE] }, { text: "Придумывать новые идеи, рисовать, сочинять музыку, писать тексты", types: [HOLLAND_TYPES.ARTISTIC] }, { text: "Помогать людям, обучать, консультировать, работать в команде", types: [HOLLAND_TYPES.SOCIAL] } ] },
    { question: "2. Представьте, что вы работаете над проектом. Какая роль вам ближе?", options: [ { text: "Исполнитель, отвечающий за практическую реализацию", types: [HOLLAND_TYPES.REALISTIC] }, { text: "Аналитик, ищущий оптимальное решение на основе данных", types: [HOLLAND_TYPES.INVESTIGATIVE, HOLLAND_TYPES.CONVENTIONAL] }, { text: "Лидер, мотивирующий команду и организующий процесс", types: [HOLLAND_TYPES.ENTERPRISING, HOLLAND_TYPES.SOCIAL] }, { text: "Генератор идей, отвечающий за креативную составляющую", types: [HOLLAND_TYPES.ARTISTIC, HOLLAND_TYPES.ENTERPRISING] } ] },
    { question: "3. Какая рабочая среда кажется вам наиболее комфортной?", options: [ { text: "Мастерская, лаборатория, природа, стройплощадка", types: [HOLLAND_TYPES.REALISTIC] }, { text: "Библиотека, научный центр, исследовательский отдел", types: [HOLLAND_TYPES.INVESTIGATIVE] }, { text: "Офис с людьми, школа, больница, общественная организация", types: [HOLLAND_TYPES.SOCIAL] }, { text: "Структурированный офис, архив, банк, бухгалтерия", types: [HOLLAND_TYPES.CONVENTIONAL] } ] },
    { question: "4. Что для вас важнее в работе?", options: [ { text: "Возможность создавать что-то новое, оригинальное, необычное", types: [HOLLAND_TYPES.ARTISTIC] }, { text: "Возможность помогать людям, быть полезным обществу", types: [HOLLAND_TYPES.SOCIAL] }, { text: "Возможность влиять на события, руководить, достигать успеха", types: [HOLLAND_TYPES.ENTERPRISING] }, { text: "Стабильность, четкие правила, порядок и предсказуемость", types: [HOLLAND_TYPES.CONVENTIONAL] } ] },
    { question: "5. Выберите тип задач, который вам интереснее решать:", options: [ { text: "Практические задачи, требующие применения физической силы или ловкости", types: [HOLLAND_TYPES.REALISTIC] }, { text: "Интеллектуальные задачи, требующие анализа и логического мышления", types: [HOLLAND_TYPES.INVESTIGATIVE] }, { text: "Задачи, связанные с организацией, планированием и управлением", types: [HOLLAND_TYPES.ENTERPRISING, HOLLAND_TYPES.CONVENTIONAL] }, { text: "Задачи, требующие воображения, интуиции и творческого подхода", types: [HOLLAND_TYPES.ARTISTIC] } ] },
    { question: "6. Как вы предпочитаете получать информацию?", options: [ { text: "Через практический опыт, пробуя и делая", types: [HOLLAND_TYPES.REALISTIC] }, { text: "Изучая теории, факты, читая специальную литературу", types: [HOLLAND_TYPES.INVESTIGATIVE] }, { text: "Общаясь с экспертами, участвуя в дискуссиях", types: [HOLLAND_TYPES.SOCIAL, HOLLAND_TYPES.ENTERPRISING] }, { text: "Через схемы, таблицы, графики, инструкции", types: [HOLLAND_TYPES.CONVENTIONAL] } ] },
    { question: "7. Какое утверждение лучше всего вас описывает?", options: [ { text: "Я практичный и предпочитаю конкретные действия", types: [HOLLAND_TYPES.REALISTIC] }, { text: "Я любознательный и люблю анализировать", types: [HOLLAND_TYPES.INVESTIGATIVE] }, { text: "Я эмоциональный и ценю самовыражение", types: [HOLLAND_TYPES.ARTISTIC] }, { text: "Я общительный и ориентирован на помощь другим", types: [HOLLAND_TYPES.SOCIAL] } ] },
    { question: "8. Какое утверждение также хорошо вас описывает?", options: [ { text: "Я амбициозный и люблю руководить", types: [HOLLAND_TYPES.ENTERPRISING] }, { text: "Я аккуратный и предпочитаю порядок", types: [HOLLAND_TYPES.CONVENTIONAL] }, { text: "Я независимый и предпочитаю работать в одиночку", types: [HOLLAND_TYPES.INVESTIGATIVE, HOLLAND_TYPES.ARTISTIC] }, { text: "Я командный игрок и ценю сотрудничество", types: [HOLLAND_TYPES.SOCIAL, HOLLAND_TYPES.ENTERPRISING] } ] },
    { question: "9. Выберите занятие, которое вам кажется наиболее привлекательным:", options: [ { text: "Проектирование и создание технических устройств", types: [HOLLAND_TYPES.REALISTIC, HOLLAND_TYPES.INVESTIGATIVE] }, { text: "Написание книги или создание музыкального произведения", types: [HOLLAND_TYPES.ARTISTIC] }, { text: "Организация благотворительного мероприятия", types: [HOLLAND_TYPES.SOCIAL, HOLLAND_TYPES.ENTERPRISING] }, { text: "Разработка финансовой стратегии компании", types: [HOLLAND_TYPES.ENTERPRISING, HOLLAND_TYPES.CONVENTIONAL] } ] },
    { question: "10. Как вы относитесь к риску?", options: [ { text: "Предпочитаю избегать риска, ценю надежность", types: [HOLLAND_TYPES.CONVENTIONAL, HOLLAND_TYPES.REALISTIC] }, { text: "Готов(а) к обдуманному риску ради значимого результата", types: [HOLLAND_TYPES.ENTERPRISING, HOLLAND_TYPES.INVESTIGATIVE] }, { text: "Риск интересен, если он связан с творчеством или новыми идеями", types: [HOLLAND_TYPES.ARTISTIC] }, { text: "Готов(а) рисковать, чтобы помочь другим или отстоять принципы", types: [HOLLAND_TYPES.SOCIAL] } ] },
    { question: "11. Что вам важнее в информации?", options: [ { text: "Практическая применимость, возможность использовать в деле", types: [HOLLAND_TYPES.REALISTIC] }, { text: "Точность, объективность, логическая стройность", types: [HOLLAND_TYPES.INVESTIGATIVE] }, { text: "Эмоциональная насыщенность, образность, оригинальность", types: [HOLLAND_TYPES.ARTISTIC] }, { text: "Понятность для других, возможность легко объяснить", types: [HOLLAND_TYPES.SOCIAL] } ] },
    { question: "12. Выберите, что вам ближе:", options: [ { text: "Работа с конкретными объектами (вещи, техника, природа)", types: [HOLLAND_TYPES.REALISTIC] }, { text: "Работа с абстрактными идеями и символами (наука, данные)", types: [HOLLAND_TYPES.INVESTIGATIVE, HOLLAND_TYPES.CONVENTIONAL] }, { text: "Работа с людьми (общение, обучение, управление)", types: [HOLLAND_TYPES.SOCIAL, HOLLAND_TYPES.ENTERPRISING] }, { text: "Работа с художественными образами (искусство, дизайн)", types: [HOLLAND_TYPES.ARTISTIC] } ] }
];

// --- ИНИЦИАЛИЗАЦИЯ FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyDODgODLHsIk6WMEWyv1LRR-w1Xvv7FXWw",
    authDomain: "proforientir-95204.firebaseapp.com",
    projectId: "proforientir-95204",
    storageBucket: "proforientir-95204.firebasestorage.app",
    messagingSenderId: "417110078361",
    appId: "1:417110078361:web:50ebd187c26447de211908",
    measurementId: "G-174BSZEDGV"
};

try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
} catch (e) {
    console.error("Firebase initialization error:", e);
}

const auth = firebase.auth();
const db = firebase.firestore();

// --- DOM Элементы ---
let currentUniForModal = null; let lastTestResultTypes = []; let currentProfessionFilterTypes = [];
let processedUniversities = []; const PROFESSIONS_PAGE_SIZE = 12; let professionsVisibleCount = PROFESSIONS_PAGE_SIZE;
let currentFilteredProfessions = []; let selectedForComparison = [];
const themeSwitchBtn = document.querySelector('.theme-switch'); const profileBtn = document.getElementById('profile-btn');
const startTestBtn = document.getElementById('start-test-btn'); const testStartDiv = document.getElementById('test-start');
const careerTestForm = document.getElementById('career-test'); const questionsContainer = document.getElementById('questions-container');
const resultsSection = document.getElementById('results'); const resultTextDiv = document.getElementById('result-text');
const resultTypesDiv = document.getElementById('result-types'); const resultExplanationDiv = document.getElementById('result-explanation');
const topMatchingProfessionsDiv = document.getElementById('top-matching-professions');
const showMatchingProfessionsBtn = document.getElementById('show-matching-professions-btn');
const saveResultBtn = document.getElementById('save-result-btn');
const professionSearchInput = document.getElementById('profession-search'); const professionsListDiv = document.getElementById('professions-list');
const resetProfessionFilterBtn = document.getElementById('reset-profession-filter-btn');
const showMoreProfessionsContainer = document.getElementById('show-more-professions-container');
const showMoreProfessionsBtn = document.getElementById('show-more-professions-btn');
const showAllProfessionsBtn = document.getElementById('show-all-professions-btn');
const recommendationsModal = document.getElementById('recommendations-modal');
const uniFilterSelect = document.getElementById('uni-filter'); const uniSortSelect = document.getElementById('uni-sort');
const resetUniFilterBtn = document.getElementById('reset-uni-filter-btn'); const compareUnisBtn = document.getElementById('compare-unis-btn');
const compareCountSpan = document.getElementById('compare-count'); const allUnisListDiv = document.getElementById('all-unis-list');
const uniModal = document.getElementById('uni-modal'); const profileModal = document.getElementById('profile-modal');
const compareModal = document.getElementById('compare-modal');
const compareTableContainer = document.getElementById('compare-table-container'); const closeModalBtns = document.querySelectorAll('.modal .close');
const uniModalTitle = document.getElementById('uni-modal-title');
const uniModalPrograms = document.getElementById('uni-programs'); const uniModalInfo = document.getElementById('uni-info');
const uniModalBudget = document.getElementById('uni-budget'); const uniModalAvgScore = document.getElementById('uni-avg-score');
const uniModalEmployment = document.getElementById('uni-employment'); const uniModalReputation = document.getElementById('uni-reputation');
const uniModalCompositeScore = document.getElementById('uni-composite-score-modal'); const modalProfessionsList = document.getElementById('modal-professions-list');
const addToFavoritesBtn = document.getElementById('add-to-favorites-btn'); const savedResultsDiv = document.getElementById('saved-results');
const favoritesDiv = document.getElementById('favorites'); const clearProfileBtn = document.getElementById('clear-profile-btn');
const currentYearSpan = document.getElementById('current-year'); const toastElement = document.getElementById('toast');
const loginBtn = document.getElementById('login-btn'); const logoutBtn = document.getElementById('logout-btn');
const profileItem = document.getElementById('profile-item'); const logoutItem = document.getElementById('logout-item');
const loginItem = document.getElementById('login-item'); const authModal = document.getElementById('auth-modal');
const authForm = document.getElementById('auth-form'); const authSubmitBtn = document.getElementById('auth-submit-btn');
const googleSigninBtn = document.getElementById('google-signin-btn'); const authSwitchLink = document.getElementById('auth-switch-link');
const authErrorP = document.getElementById('auth-error'); const authModalTitle = document.getElementById('auth-modal-title');
let isRegisterMode = false;

// --- FIREBASE AUTHENTICATION LOGIC ---
auth.onAuthStateChanged(user => {
    if (user) {
        updateUIAfterAuthStateChange(true);
        loadProfileData();
    } else {
        updateUIAfterAuthStateChange(false);
        savedResultsDiv.innerHTML = '<p>Войдите в профиль, чтобы увидеть сохраненные результаты.</p>';
        favoritesDiv.innerHTML = '<p>Войдите в профиль, чтобы увидеть избранное.</p>';
    }
});

function updateUIAfterAuthStateChange(isLoggedIn) {
    profileItem.classList.toggle('hidden', !isLoggedIn);
    logoutItem.classList.toggle('hidden', !isLoggedIn);
    loginItem.classList.toggle('hidden', isLoggedIn);
}

function handleAuthError(error) {
    console.error("Auth Error:", error.code, error.message);
    authErrorP.classList.remove('hidden');
    switch (error.code) {
        case 'auth/wrong-password': authErrorP.textContent = "Неверный пароль. Попробуйте снова."; break;
        case 'auth/user-not-found': authErrorP.textContent = "Пользователь с таким email не найден."; break;
        case 'auth/email-already-in-use': authErrorP.textContent = "Этот email уже зарегистрирован."; break;
        case 'auth/weak-password': authErrorP.textContent = "Пароль слишком слабый. Используйте не менее 6 символов."; break;
        default: authErrorP.textContent = "Произошла ошибка. Пожалуйста, попробуйте позже.";
    }
}

// --- PROFILE DATA LOGIC (FIRESTORE) ---
async function getUserData() {
    const user = auth.currentUser;
    if (!user) return null;
    const userDocRef = db.collection('profiles').doc(user.uid);
    const doc = await userDocRef.get();
    return doc.exists ? doc.data() : { savedResults: [], favorites: [] };
}

async function loadProfileData() {
    const userData = await getUserData();
    if (!userData) return;
    const { savedResults = [], favorites = [] } = userData;
    savedResultsDiv.innerHTML = savedResults.length > 0
        ? savedResults.map(res => `<div><span>${res.date}: ${res.types.map(type => `<strong>${TYPE_DESCRIPTIONS[type]?.name || type}</strong>`).join(', ')}</span><button type="button" title="Удалить результат" onclick="removeTestResult('${res.id}')"><i class="icon icon-only" data-lucide="trash-2"></i></button></div>`).join('')
        : '<p>Вы еще не сохраняли результаты теста.</p>';
    favoritesDiv.innerHTML = favorites.length > 0
        ? favorites.map(uniName => `<div><span><strong>${uniName}</strong></span><button type="button" title="Удалить из избранного" onclick="removeFavorite('${uniName}')"><i class="icon icon-only" data-lucide="trash-2"></i></button></div>`).join('')
        : '<p>Вы еще не добавляли ВУЗы в избранное.</p>';
    initLucideIcons();
}

async function saveResult() {
    const user = auth.currentUser;
    if (!user) { showToast("Пожалуйста, войдите в профиль, чтобы сохранить результат."); loginBtn.click(); return; }
    if (lastTestResultTypes.length === 0) { showToast("Сначала пройдите тест."); return; }
    const resultToSave = { id: `res_${Date.now()}`, types: lastTestResultTypes, date: new Date().toLocaleDateString('ru-RU') };
    const userDocRef = db.collection('profiles').doc(user.uid);
    await userDocRef.set({ savedResults: firebase.firestore.FieldValue.arrayUnion(resultToSave) }, { merge: true });
    showToast("Результат теста сохранен в профиле!");
    loadProfileData();
}

window.removeTestResult = async function(resultId) {
    const user = auth.currentUser;
    if (!user) return;
    const userData = await getUserData();
    if (!userData || !userData.savedResults) return;
    const resultToRemove = userData.savedResults.find(res => res.id === resultId);
    if (resultToRemove) {
      await db.collection('profiles').doc(user.uid).update({ savedResults: firebase.firestore.FieldValue.arrayRemove(resultToRemove) });
      loadProfileData();
      showToast("Результат теста удален.");
    }
}

async function toggleFavorite() {
    const user = auth.currentUser;
    if (!user) { showToast("Пожалуйста, войдите в профиль, чтобы добавить в избранное."); loginBtn.click(); return; }
    if (!currentUniForModal) return;
    const uniName = currentUniForModal.name;
    const userDocRef = db.collection('profiles').doc(user.uid);
    const userData = await getUserData();
    const isFavorite = userData?.favorites?.includes(uniName);
    const updateData = isFavorite
        ? { favorites: firebase.firestore.FieldValue.arrayRemove(uniName) }
        : { favorites: firebase.firestore.FieldValue.arrayUnion(uniName) };
    await userDocRef.set(updateData, { merge: true });
    showToast(isFavorite ? `${uniName} удален из избранного.` : `${uniName} добавлен в избранное!`);
    updateFavoriteButtonText();
    loadProfileData();
}

async function updateFavoriteButtonText() {
    const user = auth.currentUser;
    if (!user || !currentUniForModal) {
        addToFavoritesBtn.innerHTML = `<i class="icon" data-lucide="heart"></i> В избранное`;
        addToFavoritesBtn.style.backgroundColor = 'var(--accent-color)';
        initLucideIcons();
        return;
    }
    const userData = await getUserData();
    const isFavorite = userData?.favorites?.includes(currentUniForModal.name);
    addToFavoritesBtn.innerHTML = isFavorite ? `<i class="icon" data-lucide="heart-off"></i> Убрать из избранного` : `<i class="icon" data-lucide="heart"></i> В избранное`;
    addToFavoritesBtn.style.backgroundColor = isFavorite ? '#aaa' : 'var(--accent-color)';
    initLucideIcons();
}

window.removeFavorite = async function(uniName) {
    const user = auth.currentUser;
    if (!user) return;
    await db.collection('profiles').doc(user.uid).update({ favorites: firebase.firestore.FieldValue.arrayRemove(uniName) });
    loadProfileData();
    showToast(`${uniName} удален из избранного.`);
    if (uniModal.style.display === 'block' && currentUniForModal?.name === uniName) updateFavoriteButtonText();
}

function clearProfileData() {
    const user = auth.currentUser;
    if (!user) { showToast("Вы не вошли в профиль."); return; }
    if (confirm("Вы уверены, что хотите очистить все сохраненные результаты и избранное? Это действие необратимо.")) {
        db.collection('profiles').doc(user.uid).delete()
            .then(() => { loadProfileData(); showToast("Данные профиля очищены."); })
            .catch(error => { console.error("Ошибка при очистке профиля:", error); showToast("Не удалось очистить профиль."); });
    }
}

// --- Utility Functions ---
// Footer scroll logic
window.addEventListener('scroll', () => {
    const footer = document.querySelector('footer');
    if (footer) {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 20) {
            footer.classList.add('visible');
        } else {
            footer.classList.remove('visible');
        }
    }
});

function initLucideIcons() { try { if (window.lucide) { lucide.createIcons(); } } catch (error) { console.error("Error initializing Lucide icons:", error); } }
function initTheme() { const savedTheme = localStorage.getItem('proforientirTheme') || 'light'; document.body.className = savedTheme; themeSwitchBtn.innerHTML = `<i class="icon icon-only" data-lucide="${savedTheme === 'dark' ? 'sun' : 'moon'}"></i>`; themeSwitchBtn.title = savedTheme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на темную тему'; initLucideIcons(); }
function toggleTheme() { const newTheme = document.body.classList.toggle('dark') ? 'dark' : 'light'; localStorage.setItem('proforientirTheme', newTheme); themeSwitchBtn.innerHTML = `<i class="icon icon-only" data-lucide="${newTheme === 'dark' ? 'sun' : 'moon'}"></i>`; themeSwitchBtn.title = newTheme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на темную тему'; initLucideIcons(); }
function showToast(message, duration = 3000) { toastElement.textContent = message; toastElement.classList.add('show'); setTimeout(() => { toastElement.classList.remove('show'); }, duration); }
function highlightText(text, term) { if (!term || !text) return text; const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); const regex = new RegExp(`(${escapedTerm})`, 'gi'); return text.replace(regex, '<mark>$1</mark>'); }
function createTypeTagHTML(type) { const typeInfo = TYPE_DESCRIPTIONS[type] || { name: type }; return `<span class="type-tag" style="background-color: var(--${type}-color);" title="${typeInfo.description}">${typeInfo.name}</span>`; }
function calculateCompositeScore(uni) { const weights = { avgScore: 0.35, reputation: 0.30, employmentRate: 0.20, budgetPlaces: 0.15 }; const maxAvgScore = 100, minAvgScore = 60, maxBudgetPlaces = 4000, maxReputation = 10, maxEmploymentRate = 100; const normalizedScore = Math.max(0, ((uni.avgScore || minAvgScore) - minAvgScore)) / (maxAvgScore - minAvgScore); const normalizedReputation = (uni.reputation || 1) / maxReputation; const normalizedEmployment = (uni.employmentRate || 50) / maxEmploymentRate; const normalizedBudget = Math.log1p(uni.budgetPlaces || 0) / Math.log1p(maxBudgetPlaces); const compositeScore = ((normalizedScore * weights.avgScore) + (normalizedReputation * weights.reputation) + (normalizedEmployment * weights.employmentRate) + (normalizedBudget * weights.budgetPlaces)) * 100; return Math.max(0, Math.min(100, Math.round(compositeScore))); }
function processUniversityData() { processedUniversities = universities.map(uni => ({ ...uni, compositeScore: calculateCompositeScore(uni) })); }
function createUniCardHTML(uni) {
    const typeIcon = UNI_TYPE_ICONS[uni.type] || UNI_TYPE_ICONS.default;
    const isSelected = selectedForComparison.includes(uni.name);
    return `
        <div class="uni-card" data-uni-name="${uni.name}">
            <label class="compare-checkbox-label" title="Выбрать для сравнения">
                <input type="checkbox" class="compare-checkbox" value="${uni.name}" ${isSelected ? 'checked' : ''}>
            </label>
            <div class="uni-type-icon" title="Тип: ${uni.type}">
                <i class="icon icon-only icon-sm" data-lucide="${typeIcon}"></i>
            </div>
            <div class="uni-content" data-action="open-modal">
                <h4>${uni.name}</h4>
                <p class="preview-info">${uni.info}</p>
                <div class="uni-meta">
                    <span class="uni-composite-score" title="Комплексный балл"><i class="icon icon-sm" data-lucide="trending-up"></i> <strong>${uni.compositeScore}</strong></span>
                    <span class="uni-avg-score" title="Средний балл ЕГЭ"><i class="icon icon-sm" data-lucide="award"></i> <strong>${uni.avgScore || 'н/д'}</strong></span>
                </div>
            </div>
        </div>
    `;
}
function populateUniFilterOptions() { const uniqueTypes = [...new Set(universities.map(uni => uni.type))].sort((a,b) => a.localeCompare(b, 'ru')); uniFilterSelect.innerHTML = '<option value="all">Все направления</option>'; const typeNames = { tech: 'Технические', science: 'Научные', engineering: 'Инженерные', international: 'Международные', economics: 'Экономика', medical: 'Медицина', management: 'Управление', art: 'Искусство', law: 'Юриспруденция', humanities: 'Гуманитарные', education: 'Образование', social: 'Социальные', agriculture: 'Аграрные', architecture: 'Архитектура', finance: 'Финансы', transport: 'Транспортные', communications: 'Связь и IT', pedagogy: 'Педагогические', psychology: 'Психологические', food: 'Пищевые', chemical: 'Химические', geodesy: 'Геодезия и картография', music: 'Музыкальные', cinema: 'Кино и ТВ', literature: 'Литературные', aviation: 'Авиация и космос', civil_engineering: 'Строительство' }; uniqueTypes.forEach(type => { const option = document.createElement('option'); option.value = type; option.textContent = typeNames[type] || (type.charAt(0).toUpperCase() + type.slice(1)); uniFilterSelect.appendChild(option); }); }
function renderUniversities(unisToRender = processedUniversities) { const sortBy = uniSortSelect.value; let sortedUnis = [...unisToRender].sort((a, b) => { switch (sortBy) { case 'avgScore': return (b.avgScore || 0) - (a.avgScore || 0); case 'budgetPlaces': return (b.budgetPlaces || 0) - (a.budgetPlaces || 0); case 'reputation': return (b.reputation || 0) - (a.reputation || 0); case 'name': return a.name.localeCompare(b.name, 'ru'); default: return b.compositeScore - a.compositeScore; } }); allUnisListDiv.innerHTML = sortedUnis.length > 0 ? sortedUnis.map(createUniCardHTML).join('') : '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-muted-color);">ВУЗы не найдены по вашему запросу.</p>'; updateCompareButtonState(); initLucideIcons(); }
function applyUniversityFiltersAndSort() { const filterValue = uniFilterSelect.value; let filteredUnis = (filterValue === 'all') ? [...processedUniversities] : processedUniversities.filter(uni => uni.type === filterValue); renderUniversities(filteredUnis); resetUniFilterBtn.classList.toggle('hidden', filterValue === 'all'); }
function resetUniversityFilters() { uniFilterSelect.value = 'all'; uniSortSelect.value = 'compositeScore'; selectedForComparison = []; renderUniversities(processedUniversities); showToast("Фильтры и сортировка вузов сброшены."); resetUniFilterBtn.classList.add('hidden'); }
function updateCompareButtonState() { const count = selectedForComparison.length; compareCountSpan.textContent = count; compareUnisBtn.disabled = !(count >= 2 && count <= 3); compareUnisBtn.classList.toggle('hidden', count === 0); }
function handleCompareSelection(event) { const checkbox = event.target; const uniName = checkbox.value; if (checkbox.checked) { if (selectedForComparison.length < 3) { selectedForComparison.push(uniName); } else { checkbox.checked = false; showToast("Можно выбрать не более 3 вузов для сравнения."); } } else { selectedForComparison = selectedForComparison.filter(name => name !== uniName); } updateCompareButtonState(); }
function showCompareModal() { if (selectedForComparison.length < 2 || selectedForComparison.length > 3) { showToast("Выберите 2 или 3 вуза для сравнения."); return; } const unisToCompare = processedUniversities.filter(uni => selectedForComparison.includes(uni.name)); let tableHTML = '<table><thead><tr><th>Параметр</th>'; unisToCompare.forEach(uni => { tableHTML += `<th>${uni.name}</th>`; }); tableHTML += '</tr></thead><tbody>'; const params = [ { key: 'compositeScore', name: 'Компл. балл' }, { key: 'avgScore', name: 'Ср. балл ЕГЭ' }, { key: 'budgetPlaces', name: 'Бюдж. места' }, { key: 'employmentRate', name: 'Трудоустр. (%)' }, { key: 'reputation', name: 'Репутация (/10)' }, { key: 'programs', name: 'Направления' } ]; params.forEach(param => { tableHTML += `<tr><td><strong>${param.name}</strong></td>`; unisToCompare.forEach(uni => { let value = uni[param.key] || 'н/д'; if (param.key === 'programs') value = `<ul>${(uni.programs || []).map(p => `<li>${p}</li>`).join('')}</ul>`; tableHTML += `<td>${value}</td>`; }); tableHTML += '</tr>'; }); tableHTML += '</tbody></table>'; compareTableContainer.innerHTML = tableHTML; openModal('compare-modal'); }
async function openUniModal(uniName) {
    const foundUni = processedUniversities.find(u => u.name === uniName);
    currentUniForModal = foundUni; 
    if (currentUniForModal) {
        uniModalTitle.textContent = currentUniForModal.name;
        uniModalPrograms.textContent = currentUniForModal.programs.join(', '); 
        // Show extended info if available, otherwise fallback to basic info
        if (currentUniForModal.extendedInfo) {
            uniModalInfo.innerHTML = `<p class="extended-info">${currentUniForModal.extendedInfo}</p>`;
        } else {
            uniModalInfo.textContent = currentUniForModal.info;
        }
        uniModalBudget.textContent = currentUniForModal.budgetPlaces || 'н/д'; 
        uniModalAvgScore.textContent = currentUniForModal.avgScore || 'н/д'; 
        uniModalEmployment.textContent = `${currentUniForModal.employmentRate || 'н/д'}%`; 
        uniModalReputation.textContent = `${currentUniForModal.reputation || 'н/д'}/10`; 
        uniModalCompositeScore.textContent = currentUniForModal.compositeScore; 
        await updateFavoriteButtonText(); 
        displayMatchingProfessionsInModal(currentUniForModal); 
        openModal('uni-modal'); 
    } 
}
function displayMatchingProfessionsInModal(uni) { const keywords = uni.programKeywords || []; modalProfessionsList.innerHTML = '<li class="no-professions">Загрузка...</li>'; setTimeout(() => { const matchingProfessions = professions.filter(prof => (prof.keywords || []).some(pk => keywords.some(uk => uk.toLowerCase().includes(pk.toLowerCase()) || pk.toLowerCase().includes(uk.toLowerCase())))); modalProfessionsList.innerHTML = matchingProfessions.length > 0 ? matchingProfessions.map(prof => `<li class="${lastTestResultTypes.some(t => prof.types.includes(t)) ? 'highlighted' : ''}">${prof.name}</li>`).join('') : '<li class="no-professions">Подходящих профессий не найдено.</li>'; }, 10); }
function openModal(id) { const modal = document.getElementById(id); if (modal) { modal.style.display = 'block'; document.body.style.overflow = 'hidden'; initLucideIcons(); } }
function closeModals() { document.querySelectorAll('.modal').forEach(modal => { modal.style.display = 'none'; }); document.body.style.overflow = 'auto'; }
function renderTestQuestions() { questionsContainer.innerHTML = testQuestions.map((q, i) => `<div class="question"><p>${q.question}</p><div class="options"><fieldset><legend>Ответы ${i+1}</legend>${q.options.map((opt, oi) => `<label><input type="radio" name="q${i+1}" value="${oi}" required> ${opt.text}</label>`).join('')}</fieldset></div></div>`).join(''); }
function handleTestSubmit(e) { e.preventDefault(); const formData = new FormData(e.target); const scores = Object.fromEntries(Object.values(HOLLAND_TYPES).map(type => [type, 0])); let answeredCount = 0; for (let i = 0; i < testQuestions.length; i++) { const answer = formData.get(`q${i+1}`); if (answer !== null) { answeredCount++; testQuestions[i].options[parseInt(answer)].types.forEach(type => scores[type]++); } } if (answeredCount < testQuestions.length) { showToast("Пожалуйста, ответьте на все вопросы теста."); return; } const sortedScores = Object.entries(scores).sort(([,a],[,b])=>b-a); lastTestResultTypes = sortedScores.slice(0, 3).map(s => s[0]); showResults(lastTestResultTypes); resultsSection.scrollIntoView({ behavior: 'smooth' }); }
function showResults(resultTypes) { 
    careerTestForm.classList.add('hidden'); 
    testStartDiv.classList.add('hidden'); 
    resultsSection.classList.remove('hidden'); 
    resultTextDiv.innerHTML = `<h3>Ваши ведущие типы: ${resultTypes.map(t=>TYPE_DESCRIPTIONS[t]?.name||t).join(' / ')}</h3> <p>${resultTypes.map(t=>TYPE_DESCRIPTIONS[t]?.description||'').join(' ')}</p>`; 
    resultExplanationDiv.innerHTML = `<p>${resultTypes.map(t=>TYPE_DESCRIPTIONS[t]?.explanation||'').join(' ')}</p>`; 
    resultTypesDiv.innerHTML = resultTypes.map(createTypeTagHTML).join(''); 
    
    // Improved matching: filter professions that match ANY of the result types and sort by degree of match
    const matchingProfessions = professions.filter(p => resultTypes.some(rt => p.types.includes(rt)))
        .sort((a, b) => {
            const aMatches = a.types.filter(t => resultTypes.includes(t)).length;
            const bMatches = b.types.filter(t => resultTypes.includes(t)).length;
            return bMatches - aMatches;
        })
        .slice(0, 8);

    const resultsGrid = topMatchingProfessionsDiv.querySelector('.professions-grid'); 
    if (matchingProfessions.length > 0) { 
        topMatchingProfessionsDiv.classList.remove('hidden'); 
        topMatchingProfessionsDiv.querySelector('h4').textContent = 'Наиболее подходящие профессии:'; 
        resultsGrid.innerHTML = matchingProfessions.map(p => createProfessionCardHTML(p)).join(''); 
    } else { 
        topMatchingProfessionsDiv.classList.remove('hidden'); 
        topMatchingProfessionsDiv.querySelector('h4').textContent = 'Подходящие профессии не найдены'; 
        resultsGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-muted-color);">Точных совпадений не найдено. Попробуйте поискать в каталоге.</p>'; 
    } 
    initLucideIcons(); 
}
function createProfessionCardHTML(prof, searchTerm = '') {
    const salaryInfo = prof.salary ? `<div class="salary-info"><i class="icon icon-sm" data-lucide="dollar-sign"></i> ${prof.salary}</div>` : '';
    return `
        <div class="profession-card" data-profession-name-raw="${prof.name}" data-profession-desc-raw="${prof.description}">
            <h4>${highlightText(prof.name, searchTerm)}</h4>
            <p>${highlightText(prof.description, searchTerm)}</p>
            ${salaryInfo}
            <div class="profession-types">${prof.types.map(createTypeTagHTML).join('')}</div>
            <div class="profession-card-actions">
                <button type="button" class="show-unis-for-profession-btn" data-profession-name="${prof.name}"><i class="icon" data-lucide="graduation-cap"></i>Показать ВУЗы</button>
                <button type="button" class="recommendations-btn" data-profession-name="${prof.name}"><i class="icon" data-lucide="lightbulb"></i>Рекомендации</button>
            </div>
        </div>
    `;
}
function renderProfessions(profsToRender = professions, filterTypes = []) { currentProfessionFilterTypes = filterTypes; let filtered = profsToRender; if (filterTypes.length > 0) filtered = profsToRender.filter(p => filterTypes.some(ft => p.types.includes(ft))); const searchTerm = professionSearchInput.value.toLowerCase().trim(); if (searchTerm) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm) || p.description.toLowerCase().includes(searchTerm) || (p.keywords||[]).some(k=>k.toLowerCase().includes(searchTerm))); currentFilteredProfessions = filtered; const toDisplay = currentFilteredProfessions.slice(0, professionsVisibleCount); professionsListDiv.innerHTML = toDisplay.length ? toDisplay.map(p => createProfessionCardHTML(p, searchTerm)).join('') : '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-muted-color);">Профессии не найдены.</p>'; showMoreProfessionsContainer.classList.toggle('hidden', currentFilteredProfessions.length <= professionsVisibleCount); document.getElementById('professions-counter').textContent = `Показано ${Math.min(professionsVisibleCount, currentFilteredProfessions.length)} из ${currentFilteredProfessions.length}`; resetProfessionFilterBtn.classList.toggle('hidden', !searchTerm && filterTypes.length === 0); initLucideIcons(); }
function showMoreProfessions() { professionsVisibleCount += PROFESSIONS_PAGE_SIZE; renderProfessions(professions, currentProfessionFilterTypes); }
function showAllProfessions() { professionsVisibleCount = currentFilteredProfessions.length; renderProfessions(professions, currentProfessionFilterTypes); }
function filterProfessions() { professionsVisibleCount = PROFESSIONS_PAGE_SIZE; renderProfessions(professions, currentProfessionFilterTypes); }
function resetProfessionFilter() { currentProfessionFilterTypes = []; professionSearchInput.value = ''; professionsVisibleCount = PROFESSIONS_PAGE_SIZE; renderProfessions(); }

function getRelatedProfessions(profession, limit = 5) {
    const relatedProfs = professions.filter(p => {
        if (p.name === profession.name) return false;
        const commonTypes = profession.types.filter(t => p.types.includes(t));
        return commonTypes.length > 0;
    }).sort((a, b) => {
        const aCommon = profession.types.filter(t => a.types.includes(t)).length;
        const bCommon = profession.types.filter(t => b.types.includes(t)).length;
        return bCommon - aCommon;
    }).slice(0, limit);
    return relatedProfs;
}

function getSkillsForProfession(profession) {
    const skillMap = {
        investigative: ['Анализ данных', 'Исследования', 'Программирование', 'Критическое мышление'],
        realistic: ['Проектирование', 'Техническое обслуживание', 'Ремонт', 'Практические навыки'],
        artistic: ['Дизайн', 'Креативность', 'Коммуникация', 'Визуальное мышление'],
        social: ['Лидерство', 'Коммуникация', 'Эмпатия', 'Работа в команде'],
        enterprising: ['Переговоры', 'Управление', 'Стратегия', 'Предпринимательство'],
        conventional: ['Организованность', 'Внимание к деталям', 'Управление базами данных', 'Администрирование']
    };

    const skills = new Set();
    profession.types.forEach(type => {
        (skillMap[type] || []).forEach(skill => skills.add(skill));
    });
    return Array.from(skills);
}

function getCareerPath(profession) {
    const paths = {
        junior: 'Junior специалист',
        middle: 'Middle специалист',
        senior: 'Senior специалист',
        lead: 'Lead/Manager',
        expert: 'Expert/Консультант'
    };

    return [
        { level: 'Начало', description: paths.junior + ' (0-2 года)' },
        { level: 'Развитие', description: paths.middle + ' (2-5 лет)' },
        { level: 'Мастерство', description: paths.senior + ' (5-10 лет)' },
        { level: 'Лидерство', description: paths.lead + ' (10+ лет)' }
    ];
}

function showRecommendations(profession) {
    const relatedProfs = getRelatedProfessions(profession);
    const skills = getSkillsForProfession(profession);
    const careerPath = getCareerPath(profession);

    document.getElementById('recommendations-title').textContent = `Рекомендации для: ${profession.name}`;

    document.getElementById('skills-list').innerHTML = skills.map((skill, idx) => {
        const type = skill.includes('данных') || skill.includes('Программирование') ? 'technical' : 'soft';
        return `<span class="skill-tag ${type}">${skill}</span>`;
    }).join('');

    document.getElementById('related-professions').innerHTML = relatedProfs.map(p => `
        <div class="related-profession-item" onclick="showRecommendations(professions.find(x => x.name === '${p.name}'))">
            <strong>${p.name}</strong>
            <small>${p.description}</small>
        </div>
    `).join('');

    const courses = [
        { title: 'Основной курс', description: 'Базовые знания и навыки' },
        { title: 'Продвинутый уровень', description: 'Специализированные знания' },
        { title: 'Проектная практика', description: 'Реальные проекты и портфолио' }
    ];

    document.getElementById('recommended-courses').innerHTML = courses.map(c => `
        <div class="course-item">
            <strong>${c.title}</strong>
            <small>${c.description}</small>
        </div>
    `).join('');

    document.getElementById('career-path').innerHTML = careerPath.map(step => `
        <div class="career-step">
            <strong>${step.level}</strong>
            <small>${step.description}</small>
        </div>
    `).join('');

    recommendationsModal.style.display = 'block';
}

function filterUniversitiesByProfession(professionName) { const profession = professions.find(p => p.name === professionName); if (!profession) { renderUniversities(processedUniversities); return; } showToast(`Поиск ВУЗов для: ${professionName}`); const profKeywords = new Set((profession.keywords || [profession.name]).map(k => k.toLowerCase())); const matchingUnis = processedUniversities.filter(uni => (uni.programKeywords || []).some(uk => profKeywords.has(uk.toLowerCase()) || [...profKeywords].some(pk => uk.toLowerCase().includes(pk) || pk.includes(uk.toLowerCase())))); uniFilterSelect.value = 'all'; uniSortSelect.value = 'compositeScore'; renderUniversities(matchingUnis); resetUniFilterBtn.classList.remove('hidden'); document.getElementById('universities').scrollIntoView({ behavior: 'smooth' }); }
function sanitizeHTML(str) { const temp = document.createElement('div'); temp.textContent = str; return temp.innerHTML; }
function simpleMarkdownToHtml(text) { if (!text) return ''; let html = sanitizeHTML(text); html = html.replace(/^## (.*?)$/gm, '<h5>$1</h5>').replace(/^# (.*?)$/gm, '<h4>$1</h4>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/^[\*\-\+] +(.*?)$/gm, '<li>$1</li>').replace(/^\d+\. +(.*?)$/gm, '<li>$1</li>').replace(/((<li>.*<\/li>\s*)+)/gm, '<ul>$1</ul>').replace(/\n/g, '<br>'); return html; }
function setupEventListeners() {
    // АУТЕНТИФИКАЦИЯ
    loginBtn.addEventListener('click', () => { isRegisterMode = false; authModalTitle.textContent = 'Вход'; authSubmitBtn.textContent = 'Войти'; authSwitchLink.textContent = 'Нет аккаунта? Зарегистрироваться'; authErrorP.classList.add('hidden'); openModal('auth-modal'); });
    logoutBtn.addEventListener('click', () => auth.signOut().then(() => showToast("Вы успешно вышли.")).catch(handleAuthError));
    authSwitchLink.addEventListener('click', e => { e.preventDefault(); isRegisterMode = !isRegisterMode; authModalTitle.textContent = isRegisterMode ? 'Регистрация' : 'Вход'; authSubmitBtn.textContent = isRegisterMode ? 'Зарегистрироваться' : 'Войти'; authSwitchLink.textContent = isRegisterMode ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'; });
    authForm.addEventListener('submit', e => { e.preventDefault(); const email = document.getElementById('auth-email').value, password = document.getElementById('auth-password').value; if(isRegisterMode) auth.createUserWithEmailAndPassword(email, password).then(() => { showToast("Регистрация успешна!"); closeModals(); }).catch(handleAuthError); else auth.signInWithEmailAndPassword(email, password).then(() => { showToast("Вы успешно вошли!"); closeModals(); }).catch(handleAuthError); });
    googleSigninBtn.addEventListener('click', () => { const provider = new firebase.auth.GoogleAuthProvider(); auth.signInWithPopup(provider).then(res => { showToast(`Добро пожаловать, ${res.user.displayName}!`); closeModals(); }).catch(handleAuthError); });

    // ОБЩИЕ ЭЛЕМЕНТЫ УПРАВЛЕНИЯ
    themeSwitchBtn.addEventListener('click', toggleTheme);
    profileBtn.addEventListener('click', () => openModal('profile-modal'));
    closeModalBtns.forEach(btn => btn.addEventListener('click', closeModals));
    window.addEventListener('click', e => { if (e.target.classList.contains('modal')) closeModals(); });
    document.querySelectorAll('header nav a, .logo-container').forEach(a => a.addEventListener('click', function(e) { e.preventDefault(); const targetId = this.getAttribute('href')?.substring(1); if(targetId) { const el = document.getElementById(targetId); if(el) window.scrollTo({ top: el.offsetTop - 70, behavior: 'smooth' }); } else window.scrollTo({ top: 0, behavior: 'smooth' }); }));

    // ТЕСТ И РЕЗУЛЬТАТЫ
    startTestBtn.addEventListener('click', () => { testStartDiv.classList.add('hidden'); careerTestForm.classList.remove('hidden'); resultsSection.classList.add('hidden'); renderTestQuestions(); });
    careerTestForm.addEventListener('submit', handleTestSubmit);
    saveResultBtn.addEventListener('click', saveResult); // <-- ВОССТАНОВЛЕННАЯ СТРОКА
    showMatchingProfessionsBtn.addEventListener('click', () => { if (lastTestResultTypes.length) { professionsVisibleCount = PROFESSIONS_PAGE_SIZE; renderProfessions(professions, lastTestResultTypes); document.getElementById('professions').scrollIntoView({ behavior: 'smooth' }); } else showToast("Сначала пройдите тест."); });

    // ПРОФЕССИИ
    // #region agent log
    const professionTypeFilter = document.getElementById('profession-type-filter');
    let searchDebounceTimer = null;
    professionSearchInput.addEventListener('input', () => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => filterProfessions(), 300);
    });
    professionTypeFilter.addEventListener('change', () => {
        const selectedType = professionTypeFilter.value;
        currentProfessionFilterTypes = selectedType === 'all' ? [] : [selectedType];
        professionsVisibleCount = PROFESSIONS_PAGE_SIZE;
        renderProfessions(professions, currentProfessionFilterTypes);
    });
    resetProfessionFilterBtn.addEventListener('click', resetProfessionFilter);
    showMoreProfessionsBtn.addEventListener('click', showMoreProfessions);
    showAllProfessionsBtn.addEventListener('click', showAllProfessions);

    // ВУЗЫ
    uniFilterSelect.addEventListener('change', applyUniversityFiltersAndSort);
    uniSortSelect.addEventListener('change', applyUniversityFiltersAndSort);
    resetUniFilterBtn.addEventListener('click', resetUniversityFilters);
    compareUnisBtn.addEventListener('click', showCompareModal);
    allUnisListDiv.addEventListener('click', e => { // <-- ВОССТАНОВЛЕН И УЛУЧШЕН ОБРАБОТЧИК
        const card = e.target.closest('.uni-card');
        if (!card) return;
        // Если кликнули не по чекбоксу, а по другой части карточки - открываем модальное окно
        if (!e.target.classList.contains('compare-checkbox')) {
            openUniModal(card.dataset.uniName);
        }
    });
    allUnisListDiv.addEventListener('change', e => { if (e.target.classList.contains('compare-checkbox')) handleCompareSelection(e); });

    // ОБРАБОТЧИК КЛИКОВ НА КАРТОЧКАХ ПРОФЕССИЙ (включая блок результатов)
    const cardClickHandler = e => {
        const card = e.target.closest('.profession-card');
        if (!card) return;
        const profName = card.dataset.professionNameRaw;
        if (e.target.closest('.show-unis-for-profession-btn')) {
            filterUniversitiesByProfession(profName);
        } else if (e.target.closest('.recommendations-btn')) {
            const prof = professions.find(p => p.name === profName);
            if (prof) showRecommendations(prof);
        }
    };
    professionsListDiv.addEventListener('click', cardClickHandler);
    topMatchingProfessionsDiv.addEventListener('click', cardClickHandler);
    
    // КНОПКИ В МОДАЛЬНЫХ ОКНАХ
    addToFavoritesBtn.addEventListener('click', toggleFavorite);
    clearProfileBtn.addEventListener('click', clearProfileData);
}

document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    await Promise.all([loadUniversities(), loadProfessions()]);
    renderTestQuestions();
    setupEventListeners();
    if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();
});
