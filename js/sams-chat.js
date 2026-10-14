/* "Talk to SAMS" — scripted chat widget for sams-mobile.com (8 languages).
   Loaded on every page by js/sams-consent.js. The conversation is fixed (buttons and short forms, no AI);
   every answer is sent to SAMS Desk (desk.sams-mobile.com > SAMS Chat). Name, e-mail and phone are asked first.
   The only thing kept in the browser is the chat in progress (sessionStorage, cleared when the tab closes). */
(function () {
  "use strict";
  if (window.__samsChat) return;
  window.__samsChat = 1;

  var API = "https://desk.sams-mobile.com/modules/sams_chat/chat_api.php";
  var TS_SITEKEY = "0x4AAAAAAFN6i-o9IrG7js5L";              // same Cloudflare Turnstile widget as the enquiry form
  var KEY = "sams_chat_v1";
  var CSS = "/css/sams-chat.css?v=20261013d";

  var I18N = {
    en: {
      launch: "Talk to SAMS", sub: "SAMS Mobile · Zone 1 smartphones",
      intro: "Hello! Before we start, please tell us who you are.",
      fName: "Your name", fEmail: "Email", fPhone: "Telephone number",
      consent: "We use these details only to reply to you. See our <a href=\"{pp}\">Privacy Policy</a>.",
      start: "Start chat",
      eName: "Please enter your name.", eEmail: "Please enter a valid email address.", ePhone: "Please enter a valid telephone number (7–15 digits).",
      eCaptcha: "Please wait for the security check to finish, then try again.",
      eNet: "Sorry, something went wrong. Please try again or use the contact page.",
      eRate: "There are too many chats from your network right now. Please try again later or use the contact page.",
      hi: "Nice to meet you, {name}!",
      qInterest: "Are you looking for the phone, or interested in becoming a distributor?",
      oPhone: "I'm looking for the phone", oDist: "I want to become a distributor",
      aPhone: "The phone is currently in certification. Expected by the end of the year.",
      qCountry: "Great! Which country are you from?", selCountry: "Choose a country…",
      qCompany: "What is your company name? (A website is optional.)", fCompany: "Company name", fWebsite: "Website (optional)",
      qSells: "What does your company sell today? Choose all that apply.",
      sells: { ex_equipment: "Ex / industrial equipment", telecom: "Telecom / mobile devices", safety: "Safety & PPE", it: "IT & electronics", other: "Other" },
      qIndustries: "Which industries do you serve? Choose all that apply.",
      ind: { oil_gas: "Oil & gas", chemicals: "Chemicals & petrochemicals", mining: "Mining", power: "Power & utilities", marine: "Marine & shipping", other: "Other" },
      qZone1: "Do you already sell to Zone 1 / ATEX customers?",
      z1: { yes: "Yes, regularly", some: "Some experience", no: "Not yet" },
      qMsgPhone: "Anything you would like to ask or tell us? Our team will confirm the details.",
      qMsgDist: "Anything else you would like to tell us, such as the countries you want to cover? Our team will confirm the details.",
      fMsg: "Type your message…", send: "Send", skip: "Skip", next: "Next", close: "Close chat",
      thanks: "Thank you, {name}! Our team will confirm the details and get back to you at {email}.",
      again: "Start a new chat"
    },
    ar: {
      launch: "تحدّث مع SAMS", sub: "SAMS Mobile · هواتف المنطقة 1",
      intro: "مرحبًا! قبل أن نبدأ، يرجى إخبارنا من أنت.",
      fName: "الاسم", fEmail: "البريد الإلكتروني", fPhone: "رقم الهاتف",
      consent: "نستخدم هذه البيانات فقط للرد عليك. راجع <a href=\"{pp}\">سياسة الخصوصية</a>.",
      start: "ابدأ المحادثة",
      eName: "يرجى إدخال اسمك.", eEmail: "يرجى إدخال بريد إلكتروني صحيح.", ePhone: "يرجى إدخال رقم هاتف صحيح (من 7 إلى 15 رقمًا).",
      eCaptcha: "يرجى الانتظار حتى يكتمل التحقق الأمني ثم حاول مرة أخرى.",
      eNet: "عذرًا، حدث خطأ. يرجى المحاولة مرة أخرى أو استخدام صفحة الاتصال.",
      eRate: "هناك عدد كبير من المحادثات من شبكتك الآن. يرجى المحاولة لاحقًا أو استخدام صفحة الاتصال.",
      hi: "تشرفنا بمعرفتك يا {name}!",
      qInterest: "هل تبحث عن الهاتف، أم أنك مهتم بأن تصبح موزّعًا؟",
      oPhone: "أبحث عن الهاتف", oDist: "أريد أن أصبح موزّعًا",
      aPhone: "الهاتف حاليًا قيد الاعتماد. ومن المتوقع صدوره بحلول نهاية العام.",
      qCountry: "رائع! من أي دولة أنت؟", selCountry: "اختر الدولة…",
      qCompany: "ما اسم شركتك؟ (الموقع الإلكتروني اختياري.)", fCompany: "اسم الشركة", fWebsite: "الموقع الإلكتروني (اختياري)",
      qSells: "ماذا تبيع شركتك حاليًا؟ اختر كل ما ينطبق.",
      sells: { ex_equipment: "معدات Ex / صناعية", telecom: "اتصالات / أجهزة محمولة", safety: "السلامة ومعدات الوقاية", it: "تقنية المعلومات والإلكترونيات", other: "أخرى" },
      qIndustries: "ما القطاعات التي تخدمها؟ اختر كل ما ينطبق.",
      ind: { oil_gas: "النفط والغاز", chemicals: "الكيماويات والبتروكيماويات", mining: "التعدين", power: "الطاقة والمرافق", marine: "الملاحة البحرية", other: "أخرى" },
      qZone1: "هل تبيع بالفعل لعملاء المنطقة 1 / ATEX؟",
      z1: { yes: "نعم، بانتظام", some: "لدي بعض الخبرة", no: "ليس بعد" },
      qMsgPhone: "هل لديك سؤال أو ما تودّ إخبارنا به؟ سيؤكد فريقنا التفاصيل.",
      qMsgDist: "هل هناك ما تودّ إخبارنا به، مثل الدول التي تريد تغطيتها؟ سيؤكد فريقنا التفاصيل.",
      fMsg: "اكتب رسالتك…", send: "إرسال", skip: "تخطّي", next: "التالي", close: "إغلاق المحادثة",
      thanks: "شكرًا لك يا {name}! سيؤكد فريقنا التفاصيل ويتواصل معك على {email}.",
      again: "بدء محادثة جديدة"
    },
    de: {
      launch: "Mit SAMS sprechen", sub: "SAMS Mobile · Zone-1-Smartphones",
      intro: "Hallo! Bevor wir starten, sagen Sie uns bitte, wer Sie sind.",
      fName: "Ihr Name", fEmail: "E-Mail", fPhone: "Telefonnummer",
      consent: "Wir verwenden diese Angaben nur, um Ihnen zu antworten. Siehe <a href=\"{pp}\">Datenschutzerklärung</a>.",
      start: "Chat starten",
      eName: "Bitte geben Sie Ihren Namen ein.", eEmail: "Bitte geben Sie eine gültige E-Mail-Adresse ein.", ePhone: "Bitte geben Sie eine gültige Telefonnummer ein (7–15 Ziffern).",
      eCaptcha: "Bitte warten Sie, bis die Sicherheitsprüfung abgeschlossen ist, und versuchen Sie es erneut.",
      eNet: "Entschuldigung, etwas ist schiefgelaufen. Bitte versuchen Sie es erneut oder nutzen Sie die Kontaktseite.",
      eRate: "Von Ihrem Netzwerk kommen gerade zu viele Chats. Bitte versuchen Sie es später erneut oder nutzen Sie die Kontaktseite.",
      hi: "Schön, Sie kennenzulernen, {name}!",
      qInterest: "Suchen Sie das Telefon, oder möchten Sie Vertriebspartner werden?",
      oPhone: "Ich suche das Telefon", oDist: "Ich möchte Vertriebspartner werden",
      aPhone: "Das Telefon befindet sich derzeit in der Zertifizierung. Die Markteinführung wird bis Jahresende erwartet.",
      qCountry: "Prima! Aus welchem Land kommen Sie?", selCountry: "Land auswählen…",
      qCompany: "Wie heißt Ihr Unternehmen? (Website optional.)", fCompany: "Firmenname", fWebsite: "Website (optional)",
      qSells: "Was verkauft Ihr Unternehmen derzeit? Wählen Sie alles Zutreffende.",
      sells: { ex_equipment: "Ex-/Industrieausrüstung", telecom: "Telekom / Mobilgeräte", safety: "Sicherheit & PSA", it: "IT & Elektronik", other: "Sonstiges" },
      qIndustries: "Welche Branchen bedienen Sie? Wählen Sie alles Zutreffende.",
      ind: { oil_gas: "Öl & Gas", chemicals: "Chemie & Petrochemie", mining: "Bergbau", power: "Energie & Versorger", marine: "Schifffahrt", other: "Sonstiges" },
      qZone1: "Beliefern Sie bereits Kunden in Zone 1 / ATEX?",
      z1: { yes: "Ja, regelmäßig", some: "Etwas Erfahrung", no: "Noch nicht" },
      qMsgPhone: "Möchten Sie uns etwas fragen oder mitteilen? Unser Team bestätigt Ihnen die Details.",
      qMsgDist: "Möchten Sie uns noch etwas mitteilen, z. B. welche Länder Sie abdecken möchten? Unser Team bestätigt Ihnen die Details.",
      fMsg: "Ihre Nachricht…", send: "Senden", skip: "Überspringen", next: "Weiter", close: "Chat schließen",
      thanks: "Vielen Dank, {name}! Unser Team bestätigt die Details und meldet sich unter {email} bei Ihnen.",
      again: "Neuen Chat starten"
    },
    fr: {
      launch: "Parler à SAMS", sub: "SAMS Mobile · smartphones Zone 1",
      intro: "Bonjour ! Avant de commencer, dites-nous qui vous êtes.",
      fName: "Votre nom", fEmail: "E-mail", fPhone: "Numéro de téléphone",
      consent: "Nous utilisons ces informations uniquement pour vous répondre. Voir la <a href=\"{pp}\">politique de confidentialité</a>.",
      start: "Démarrer le chat",
      eName: "Veuillez saisir votre nom.", eEmail: "Veuillez saisir une adresse e-mail valide.", ePhone: "Veuillez saisir un numéro de téléphone valide (7 à 15 chiffres).",
      eCaptcha: "Veuillez attendre la fin du contrôle de sécurité, puis réessayez.",
      eNet: "Désolé, une erreur est survenue. Veuillez réessayer ou utiliser la page de contact.",
      eRate: "Trop de chats depuis votre réseau en ce moment. Veuillez réessayer plus tard ou utiliser la page de contact.",
      hi: "Enchanté, {name} !",
      qInterest: "Vous cherchez le téléphone, ou souhaitez-vous devenir distributeur ?",
      oPhone: "Je cherche le téléphone", oDist: "Je souhaite devenir distributeur",
      aPhone: "Le téléphone est actuellement en cours de certification. Sortie attendue d'ici la fin de l'année.",
      qCountry: "Parfait ! De quel pays êtes-vous ?", selCountry: "Choisir un pays…",
      qCompany: "Quel est le nom de votre entreprise ? (Le site web est facultatif.)", fCompany: "Nom de l'entreprise", fWebsite: "Site web (facultatif)",
      qSells: "Que vend votre entreprise aujourd'hui ? Choisissez tout ce qui s'applique.",
      sells: { ex_equipment: "Équipements Ex / industriels", telecom: "Télécom / appareils mobiles", safety: "Sécurité et EPI", it: "Informatique et électronique", other: "Autre" },
      qIndustries: "Quels secteurs servez-vous ? Choisissez tout ce qui s'applique.",
      ind: { oil_gas: "Pétrole et gaz", chemicals: "Chimie et pétrochimie", mining: "Mines", power: "Énergie et services publics", marine: "Maritime", other: "Autre" },
      qZone1: "Vendez-vous déjà à des clients en Zone 1 / ATEX ?",
      z1: { yes: "Oui, régulièrement", some: "Un peu d'expérience", no: "Pas encore" },
      qMsgPhone: "Une question ou quelque chose à nous dire ? Notre équipe confirmera les détails.",
      qMsgDist: "Autre chose à nous dire, par exemple les pays que vous souhaitez couvrir ? Notre équipe confirmera les détails.",
      fMsg: "Votre message…", send: "Envoyer", skip: "Passer", next: "Suivant", close: "Fermer le chat",
      thanks: "Merci, {name} ! Notre équipe confirmera les détails et vous répondra à {email}.",
      again: "Nouveau chat"
    },
    es: {
      launch: "Hablar con SAMS", sub: "SAMS Mobile · smartphones Zona 1",
      intro: "¡Hola! Antes de empezar, cuéntanos quién eres.",
      fName: "Tu nombre", fEmail: "Correo electrónico", fPhone: "Número de teléfono",
      consent: "Usamos estos datos solo para responderte. Consulta la <a href=\"{pp}\">Política de privacidad</a>.",
      start: "Iniciar chat",
      eName: "Introduce tu nombre.", eEmail: "Introduce un correo electrónico válido.", ePhone: "Introduce un número de teléfono válido (de 7 a 15 dígitos).",
      eCaptcha: "Espera a que termine la verificación de seguridad e inténtalo de nuevo.",
      eNet: "Lo sentimos, algo salió mal. Inténtalo de nuevo o usa la página de contacto.",
      eRate: "Hay demasiados chats desde tu red en este momento. Inténtalo más tarde o usa la página de contacto.",
      hi: "¡Encantados, {name}!",
      qInterest: "¿Buscas el teléfono o te interesa ser distribuidor?",
      oPhone: "Busco el teléfono", oDist: "Quiero ser distribuidor",
      aPhone: "El teléfono está actualmente en proceso de certificación. Se espera para finales de año.",
      qCountry: "¡Perfecto! ¿De qué país eres?", selCountry: "Elige un país…",
      qCompany: "¿Cómo se llama tu empresa? (El sitio web es opcional.)", fCompany: "Nombre de la empresa", fWebsite: "Sitio web (opcional)",
      qSells: "¿Qué vende hoy tu empresa? Elige todo lo que corresponda.",
      sells: { ex_equipment: "Equipos Ex / industriales", telecom: "Telecomunicaciones / dispositivos móviles", safety: "Seguridad y EPI", it: "TI y electrónica", other: "Otro" },
      qIndustries: "¿A qué sectores atiendes? Elige todo lo que corresponda.",
      ind: { oil_gas: "Petróleo y gas", chemicals: "Química y petroquímica", mining: "Minería", power: "Energía y servicios públicos", marine: "Marítimo", other: "Otro" },
      qZone1: "¿Ya vendes a clientes de Zona 1 / ATEX?",
      z1: { yes: "Sí, con regularidad", some: "Algo de experiencia", no: "Todavía no" },
      qMsgPhone: "¿Quieres preguntarnos o contarnos algo? Nuestro equipo confirmará los detalles.",
      qMsgDist: "¿Algo más que quieras contarnos, como los países que deseas cubrir? Nuestro equipo confirmará los detalles.",
      fMsg: "Escribe tu mensaje…", send: "Enviar", skip: "Omitir", next: "Siguiente", close: "Cerrar chat",
      thanks: "¡Gracias, {name}! Nuestro equipo confirmará los detalles y te responderá en {email}.",
      again: "Iniciar un chat nuevo"
    },
    pt: {
      launch: "Falar com a SAMS", sub: "SAMS Mobile · smartphones Zona 1",
      intro: "Olá! Antes de começarmos, diga-nos quem você é.",
      fName: "Seu nome", fEmail: "E-mail", fPhone: "Número de telefone",
      consent: "Usamos estes dados apenas para responder a você. Veja a <a href=\"{pp}\">Política de Privacidade</a>.",
      start: "Iniciar chat",
      eName: "Digite seu nome.", eEmail: "Digite um e-mail válido.", ePhone: "Digite um número de telefone válido (7 a 15 dígitos).",
      eCaptcha: "Aguarde a conclusão da verificação de segurança e tente novamente.",
      eNet: "Desculpe, algo deu errado. Tente novamente ou use a página de contato.",
      eRate: "Há muitos chats da sua rede neste momento. Tente mais tarde ou use a página de contato.",
      hi: "Prazer, {name}!",
      qInterest: "Você procura o telefone ou tem interesse em se tornar distribuidor?",
      oPhone: "Procuro o telefone", oDist: "Quero ser distribuidor",
      aPhone: "O telefone está atualmente em certificação. A previsão é para o fim do ano.",
      qCountry: "Ótimo! De que país você é?", selCountry: "Escolha um país…",
      qCompany: "Qual é o nome da sua empresa? (O site é opcional.)", fCompany: "Nome da empresa", fWebsite: "Site (opcional)",
      qSells: "O que a sua empresa vende hoje? Escolha tudo o que se aplica.",
      sells: { ex_equipment: "Equipamentos Ex / industriais", telecom: "Telecom / dispositivos móveis", safety: "Segurança e EPI", it: "TI e eletrônicos", other: "Outro" },
      qIndustries: "Quais setores você atende? Escolha tudo o que se aplica.",
      ind: { oil_gas: "Petróleo e gás", chemicals: "Químicos e petroquímicos", mining: "Mineração", power: "Energia e utilidades", marine: "Marítimo", other: "Outro" },
      qZone1: "Você já vende para clientes de Zona 1 / ATEX?",
      z1: { yes: "Sim, regularmente", some: "Alguma experiência", no: "Ainda não" },
      qMsgPhone: "Quer perguntar ou contar algo? Nossa equipe confirmará os detalhes.",
      qMsgDist: "Quer contar mais alguma coisa, como os países que deseja atender? Nossa equipe confirmará os detalhes.",
      fMsg: "Escreva sua mensagem…", send: "Enviar", skip: "Pular", next: "Avançar", close: "Fechar chat",
      thanks: "Obrigado, {name}! Nossa equipe confirmará os detalhes e responderá a você em {email}.",
      again: "Iniciar novo chat"
    },
    ru: {
      launch: "Связаться с SAMS", sub: "SAMS Mobile · смартфоны для зоны 1",
      intro: "Здравствуйте! Прежде чем начать, расскажите, кто вы.",
      fName: "Ваше имя", fEmail: "Эл. почта", fPhone: "Номер телефона",
      consent: "Мы используем эти данные только для ответа вам. См. <a href=\"{pp}\">Политику конфиденциальности</a>.",
      start: "Начать чат",
      eName: "Пожалуйста, введите имя.", eEmail: "Пожалуйста, введите действительный адрес эл. почты.", ePhone: "Пожалуйста, введите действительный номер телефона (7–15 цифр).",
      eCaptcha: "Дождитесь завершения проверки безопасности и попробуйте снова.",
      eNet: "Извините, что-то пошло не так. Попробуйте снова или воспользуйтесь страницей контактов.",
      eRate: "С вашей сети сейчас слишком много обращений. Попробуйте позже или воспользуйтесь страницей контактов.",
      hi: "Приятно познакомиться, {name}!",
      qInterest: "Вы ищете телефон или хотите стать дистрибьютором?",
      oPhone: "Я ищу телефон", oDist: "Хочу стать дистрибьютором",
      aPhone: "Телефон сейчас проходит сертификацию. Ожидается к концу года.",
      qCountry: "Отлично! Из какой вы страны?", selCountry: "Выберите страну…",
      qCompany: "Как называется ваша компания? (Сайт указывать необязательно.)", fCompany: "Название компании", fWebsite: "Сайт (необязательно)",
      qSells: "Что ваша компания продаёт сейчас? Выберите всё подходящее.",
      sells: { ex_equipment: "Ex-/промышленное оборудование", telecom: "Телеком / мобильные устройства", safety: "Безопасность и СИЗ", it: "ИТ и электроника", other: "Другое" },
      qIndustries: "Какие отрасли вы обслуживаете? Выберите всё подходящее.",
      ind: { oil_gas: "Нефть и газ", chemicals: "Химия и нефтехимия", mining: "Горная добыча", power: "Энергетика и коммунальные услуги", marine: "Морской транспорт", other: "Другое" },
      qZone1: "Вы уже продаёте клиентам из зоны 1 / ATEX?",
      z1: { yes: "Да, регулярно", some: "Есть некоторый опыт", no: "Пока нет" },
      qMsgPhone: "Хотите о чём-то спросить или что-то сообщить? Наша команда подтвердит детали.",
      qMsgDist: "Хотите что-то добавить, например страны, которые вы хотите охватить? Наша команда подтвердит детали.",
      fMsg: "Введите сообщение…", send: "Отправить", skip: "Пропустить", next: "Далее", close: "Закрыть чат",
      thanks: "Спасибо, {name}! Наша команда подтвердит детали и свяжется с вами по адресу {email}.",
      again: "Начать новый чат"
    },
    th: {
      launch: "คุยกับ SAMS", sub: "SAMS Mobile · สมาร์ทโฟนโซน 1",
      intro: "สวัสดี ก่อนเริ่มสนทนา กรุณาบอกเราว่าคุณคือใคร",
      fName: "ชื่อของคุณ", fEmail: "อีเมล", fPhone: "หมายเลขโทรศัพท์",
      consent: "เราใช้ข้อมูลนี้เพื่อติดต่อกลับคุณเท่านั้น ดู<a href=\"{pp}\">นโยบายความเป็นส่วนตัว</a>",
      start: "เริ่มแชท",
      eName: "กรุณากรอกชื่อของคุณ", eEmail: "กรุณากรอกอีเมลที่ถูกต้อง", ePhone: "กรุณากรอกหมายเลขโทรศัพท์ที่ถูกต้อง (7–15 หลัก)",
      eCaptcha: "กรุณารอให้การตรวจสอบความปลอดภัยเสร็จสิ้นแล้วลองอีกครั้ง",
      eNet: "ขออภัย เกิดข้อผิดพลาด กรุณาลองอีกครั้งหรือใช้หน้าติดต่อเรา",
      eRate: "ขณะนี้มีการแชทจากเครือข่ายของคุณมากเกินไป กรุณาลองใหม่ภายหลังหรือใช้หน้าติดต่อเรา",
      hi: "ยินดีที่ได้รู้จัก คุณ{name}",
      qInterest: "คุณกำลังมองหาโทรศัพท์ หรือสนใจเป็นตัวแทนจำหน่าย?",
      oPhone: "ฉันกำลังมองหาโทรศัพท์", oDist: "ฉันสนใจเป็นตัวแทนจำหน่าย",
      aPhone: "ขณะนี้โทรศัพท์อยู่ระหว่างการรับรอง คาดว่าจะพร้อมภายในสิ้นปีนี้",
      qCountry: "ยอดเยี่ยม! คุณมาจากประเทศใด?", selCountry: "เลือกประเทศ…",
      qCompany: "บริษัทของคุณชื่ออะไร? (เว็บไซต์ไม่บังคับ)", fCompany: "ชื่อบริษัท", fWebsite: "เว็บไซต์ (ไม่บังคับ)",
      qSells: "ปัจจุบันบริษัทของคุณจำหน่ายอะไร? เลือกได้หลายข้อ",
      sells: { ex_equipment: "อุปกรณ์ Ex / อุตสาหกรรม", telecom: "โทรคมนาคม / อุปกรณ์มือถือ", safety: "ความปลอดภัยและ PPE", it: "ไอทีและอิเล็กทรอนิกส์", other: "อื่น ๆ" },
      qIndustries: "คุณให้บริการอุตสาหกรรมใดบ้าง? เลือกได้หลายข้อ",
      ind: { oil_gas: "น้ำมันและก๊าซ", chemicals: "เคมีและปิโตรเคมี", mining: "เหมืองแร่", power: "พลังงานและสาธารณูปโภค", marine: "การเดินเรือ", other: "อื่น ๆ" },
      qZone1: "คุณขายให้ลูกค้าโซน 1 / ATEX อยู่แล้วหรือไม่?",
      z1: { yes: "ใช่ เป็นประจำ", some: "มีประสบการณ์บ้าง", no: "ยังไม่มี" },
      qMsgPhone: "มีอะไรอยากสอบถามหรือแจ้งเราไหม? ทีมงานจะยืนยันรายละเอียดให้",
      qMsgDist: "มีอะไรอยากแจ้งเพิ่มเติมไหม เช่น ประเทศที่ต้องการครอบคลุม? ทีมงานจะยืนยันรายละเอียดให้",
      fMsg: "พิมพ์ข้อความของคุณ…", send: "ส่ง", skip: "ข้าม", next: "ถัดไป", close: "ปิดแชท",
      thanks: "ขอบคุณ คุณ{name} ทีมงานจะยืนยันรายละเอียดและติดต่อกลับทาง {email}",
      again: "เริ่มแชทใหม่"
    }
  };

  var lang = (document.documentElement.getAttribute("lang") || "en").slice(0, 2).toLowerCase();
  if (!I18N[lang]) lang = "en";
  var T = I18N[lang];
  var prefix = lang === "en" ? "" : "/" + lang;
  var CODES = ("AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ " +
    "DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT JE JM JO JP " +
    "KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ " +
    "OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ " +
    "VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW").split(" ");

  /* ---------------------------------------------------------------- small helpers */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(s, o) { return s.replace(/\{(\w+)\}/g, function (m, k) { return o && o[k] != null ? o[k] : m; }); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var store = {
    get: function () { try { return JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch (e) { return null; } },
    set: function (v) { try { sessionStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} },
    clear: function () { try { sessionStorage.removeItem(KEY); } catch (e) {} }
  };
  function countryName(code, l) {
    try { return new Intl.DisplayNames([l], { type: "region" }).of(code) || code; } catch (e) { return code; }
  }

  /* ---------------------------------------------------------------- state */
  var S = store.get() || { tok: "", name: "", email: "", step: "intro", branch: "", msgs: [], open: false };
  function save() { store.set(S); }

  var root, fab, panel, body, foot, shownAt = performance.now(), chain = Promise.resolve();
  var tsLoading = null, tsApi = null, tsId = null;

  /* ---------------------------------------------------------------- API */
  function api(fields) {
    var fd = new FormData();
    Object.keys(fields).forEach(function (k) {
      var v = fields[k];
      if (Array.isArray(v)) v.forEach(function (x) { fd.append(k + "[]", x); }); else fd.append(k, v);
    });
    return fetch(API, { method: "POST", body: fd, headers: { Accept: "application/json" } })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, json: j }; }); })
      .catch(function () { return { status: 0, json: {} }; });
  }
  function sendStep(step, value, label) {
    var f = { action: "step", token: S.tok, step: step, value: value };
    if (label) f.label = label;
    return api(f).then(function (r) {
      if (r.status === 404) { S = { tok: "", name: "", email: "", step: "intro", branch: "", msgs: [], open: true }; save(); render(true); }
      return r;
    });
  }

  /* ---------------------------------------------------------------- messages */
  function scrollDown() { body.scrollTop = body.scrollHeight; }
  function addMsg(who, html, keep) {
    var m = el("div", "smc-m smc-m--" + who, html);
    body.appendChild(m);
    scrollDown();
    if (keep !== false) { S.msgs.push({ w: who, h: html }); save(); }
    return m;
  }
  /* bot lines appear one after another with a short typing indicator */
  function bot(html) {
    chain = chain.then(function () {
      return new Promise(function (resolve) {
        if (reduce) { addMsg("bot", html); return resolve(); }
        var t = el("div", "smc-m smc-m--bot smc-typing", "<i></i><i></i><i></i>");
        t.setAttribute("aria-hidden", "true");
        body.appendChild(t); scrollDown();
        setTimeout(function () { t.remove(); addMsg("bot", html); resolve(); }, 520);
      });
    });
    return chain;
  }
  function user(text) { addMsg("user", esc(text)); }
  function setFoot(node) { foot.innerHTML = ""; if (node) foot.appendChild(node); scrollDown(); }   // the footer changes height, so keep the newest line in view
  function later(fn) { chain = chain.then(fn); return chain; }

  /* ---------------------------------------------------------------- Turnstile (lazy, same as the enquiry form) */
  function loadTurnstile() {
    if (!tsLoading) {
      tsLoading = new Promise(function (resolve) {
        if (window.turnstile) return resolve(window.turnstile);
        window.__samsChatTs = function () { resolve(window.turnstile); };
        var s = document.createElement("script");
        s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__samsChatTs";
        s.async = true; s.onerror = function () { resolve(null); };
        document.head.appendChild(s);
      });
    }
    return tsLoading;
  }

  /* ---------------------------------------------------------------- steps */
  function showIntro() {
    S.step = "intro"; save();
    body.innerHTML = ""; S.msgs = [];
    setFoot(null);
    var card = el("form", "smc-card");
    card.setAttribute("novalidate", "");
    card.innerHTML =
      "<p>" + esc(T.intro) + "</p>" +
      '<label class="smc-f"><span>' + esc(T.fName) + '</span><input class="smc-in" name="name" type="text" autocomplete="name" maxlength="160" required></label>' +
      '<label class="smc-f"><span>' + esc(T.fEmail) + '</span><input class="smc-in" name="email" type="email" autocomplete="email" maxlength="190" required></label>' +
      '<label class="smc-f"><span>' + esc(T.fPhone) + '</span><input class="smc-in" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="40" required></label>' +
      '<div class="smc-hp" aria-hidden="true"><label>Website <input name="hp_confirm" type="text" tabindex="-1" autocomplete="off"></label></div>' +
      '<div class="smc-turn"></div>' +
      '<p class="smc-consent">' + fmt(T.consent, { pp: prefix + "/privacy-policy/" }) + "</p>" +
      '<p class="smc-err" role="alert"></p>' +
      '<button class="smc-btn smc-btn--block" type="submit">' + esc(T.start) + "</button>";
    body.appendChild(card);
    shownAt = performance.now();
    var err = card.querySelector(".smc-err"), box = card.querySelector(".smc-turn"), btn = card.querySelector("button");
    card.addEventListener("focusin", function () {
      loadTurnstile().then(function (ts) {
        if (ts && tsId === null) { tsApi = ts; tsId = ts.render(box, { sitekey: TS_SITEKEY, theme: "light" }); }
      });
    }, { once: true });
    card.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = card.elements, name = f.name.value.trim(), email = f.email.value.trim(), phone = f.phone.value.trim();
      var digits = (phone.match(/\d/g) || []).length;
      ["name", "email", "phone"].forEach(function (k) { f[k].removeAttribute("aria-invalid"); });
      var bad = null;
      if (name.length < 2) bad = ["name", T.eName];
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) bad = ["email", T.eEmail];
      else if (digits < 7 || digits > 15) bad = ["phone", T.ePhone];
      if (bad) { f[bad[0]].setAttribute("aria-invalid", "true"); f[bad[0]].focus(); err.textContent = bad[1]; return; }
      var token = tsApi && tsId !== null ? tsApi.getResponse(tsId) : "";
      if (tsApi && tsId !== null && !token) { err.textContent = T.eCaptcha; return; }
      err.textContent = ""; btn.disabled = true;
      var data = { action: "start", name: name, email: email, phone: phone, lang: lang, page: location.pathname,
        hp_confirm: f.hp_confirm.value, elapsed: String(Math.round(performance.now() - shownAt)) };
      if (token) data["cf-turnstile-response"] = token;
      api(data).then(function (r) {
        btn.disabled = false;
        if (r.status === 200 && r.json && r.json.ok && r.json.token) {
          S.tok = r.json.token; S.name = name; S.email = email; save();
          card.remove(); addMsg("user", esc(name));
          bot(esc(fmt(T.hi, { name: name }))); askInterest();
        } else {
          if (tsApi && tsId !== null) { try { tsApi.reset(tsId); } catch (x) {} }
          err.textContent = r.status === 429 ? T.eRate : (r.json && r.json.error === "captcha" ? T.eCaptcha : T.eNet);
        }
      });
    });
    setTimeout(function () { var i = card.querySelector("input"); if (i && S.open) i.focus(); }, 60);
  }

  function optionButtons(items, onPick) {
    var wrap = el("div", "smc-opts");
    items.forEach(function (it) {
      var b = el("button", "smc-opt", esc(it[1])); b.type = "button";
      b.addEventListener("click", function () { setFoot(null); onPick(it[0], it[1]); });
      wrap.appendChild(b);
    });
    setFoot(wrap);
    var first = wrap.querySelector("button"); if (first && S.open) first.focus({ preventScroll: true });
  }
  function askInterest() {
    later(function () { S.step = "interest"; save(); });
    bot(esc(T.qInterest));
    later(function () {
      optionButtons([["phone", T.oPhone], ["distributor", T.oDist]], function (v, label) {
        user(label); S.branch = v; save(); sendStep("interest", v);
        if (v === "phone") { bot(esc(T.aPhone)); askMessage(); } else { askCountry(); }
      });
    });
  }
  function askCountry() {
    later(function () { S.step = "country"; save(); });
    bot(esc(T.qCountry));
    later(function () {
      var names = CODES.map(function (c) { return [c, countryName(c, lang)]; });
      names.sort(function (a, b) { return a[1].localeCompare(b[1], lang); });
      var wrap = el("div");
      var sel = el("select", "smc-in");
      sel.setAttribute("aria-label", T.qCountry);
      sel.innerHTML = '<option value="">' + esc(T.selCountry) + "</option>" +
        names.map(function (n) { return '<option value="' + n[0] + '">' + esc(n[1]) + "</option>"; }).join("");
      var go = el("button", "smc-btn smc-btn--block", esc(T.next)); go.type = "button"; go.disabled = true;
      sel.addEventListener("change", function () { go.disabled = !sel.value; });
      go.addEventListener("click", function () {
        var code = sel.value; if (!code) return;
        user(sel.options[sel.selectedIndex].text); setFoot(null);
        sendStep("country", code, countryName(code, "en"));
        askCompany();
      });
      wrap.appendChild(sel); wrap.appendChild(go); setFoot(wrap);
      if (S.open) sel.focus({ preventScroll: true });
    });
  }
  function askCompany() {
    later(function () { S.step = "company"; save(); });
    bot(esc(T.qCompany));
    later(function () {
      var wrap = el("div");
      var c = el("input", "smc-in"); c.type = "text"; c.maxLength = 200; c.placeholder = T.fCompany; c.setAttribute("aria-label", T.fCompany); c.autocomplete = "organization";
      var w = el("input", "smc-in"); w.type = "text"; w.maxLength = 200; w.placeholder = T.fWebsite; w.setAttribute("aria-label", T.fWebsite); w.autocomplete = "url"; w.inputMode = "url";
      var go = el("button", "smc-btn smc-btn--block", esc(T.next)); go.type = "button"; go.disabled = true;
      c.addEventListener("input", function () { go.disabled = c.value.trim().length < 2; });
      function submit() {
        var cv = c.value.trim(), wv = w.value.trim(); if (cv.length < 2) return;
        user(cv + (wv ? " · " + wv : "")); setFoot(null);
        sendStep("company", cv).then(function () { if (wv) sendStep("website", wv); });   // one after the other: each saves into the same row
        askSells();
      }
      go.addEventListener("click", submit);
      [c, w].forEach(function (i) { i.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); submit(); } }); });
      wrap.appendChild(c); wrap.appendChild(w); wrap.appendChild(go); setFoot(wrap);
      if (S.open) c.focus({ preventScroll: true });
    });
  }
  function multi(stepId, question, opts, nextFn) {
    later(function () { S.step = stepId; save(); });
    bot(esc(question));
    later(function () {
      var wrap = el("div"), chips = el("div", "smc-chips"), picked = {};
      Object.keys(opts).forEach(function (k) {
        var b = el("button", "smc-chip", esc(opts[k])); b.type = "button"; b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", function () {
          picked[k] = !picked[k]; b.setAttribute("aria-pressed", picked[k] ? "true" : "false");
          go.disabled = !Object.keys(picked).some(function (x) { return picked[x]; });
        });
        chips.appendChild(b);
      });
      var go = el("button", "smc-btn smc-btn--block", esc(T.next)); go.type = "button"; go.disabled = true;
      go.addEventListener("click", function () {
        var keys = Object.keys(picked).filter(function (x) { return picked[x]; });
        if (!keys.length) return;
        user(keys.map(function (k) { return opts[k]; }).join(", ")); setFoot(null);
        sendStep(stepId, keys); nextFn();
      });
      wrap.appendChild(chips); wrap.appendChild(go); setFoot(wrap);
      var f = chips.querySelector("button"); if (f && S.open) f.focus({ preventScroll: true });
    });
  }
  function askSells() { multi("sells", T.qSells, T.sells, askIndustries); }
  function askIndustries() { multi("industries", T.qIndustries, T.ind, askZone1); }
  function askZone1() {
    later(function () { S.step = "zone1"; save(); });
    bot(esc(T.qZone1));
    later(function () {
      optionButtons([["yes", T.z1.yes], ["some", T.z1.some], ["no", T.z1.no]], function (v, label) {
        user(label); sendStep("zone1", v); askMessage();
      });
    });
  }
  function askMessage() {
    later(function () { S.step = "message"; save(); });
    bot(esc(S.branch === "phone" ? T.qMsgPhone : T.qMsgDist));
    later(function () {
      var wrap = el("div");
      var ta = el("textarea", "smc-in"); ta.maxLength = 1000; ta.placeholder = T.fMsg; ta.setAttribute("aria-label", T.fMsg);
      var row = el("div", "smc-row");
      var skip = el("button", "smc-btn smc-btn--ghost", esc(T.skip)); skip.type = "button";
      var send = el("button", "smc-btn", esc(T.send)); send.type = "button"; send.disabled = true;
      ta.addEventListener("input", function () { send.disabled = ta.value.trim().length < 2; });
      send.addEventListener("click", function () {
        var v = ta.value.trim(); if (v.length < 2) return;
        user(v); setFoot(null); sendStep("message", v).then(finish);
      });
      skip.addEventListener("click", function () { setFoot(null); finish(); });
      row.appendChild(skip); row.appendChild(send); wrap.appendChild(ta); wrap.appendChild(row); setFoot(wrap);
      if (S.open) ta.focus({ preventScroll: true });
    });
  }
  function finish() {
    api({ action: "finish", token: S.tok });
    bot(esc(fmt(T.thanks, { name: S.name, email: S.email })));
    later(function () {
      S.step = "done"; save();
      var again = el("button", "smc-btn smc-btn--ghost smc-btn--block", esc(T.again)); again.type = "button";
      again.addEventListener("click", function () { S = { tok: "", name: "", email: "", step: "intro", branch: "", msgs: [], open: true }; save(); render(true); });
      setFoot(again);
    });
  }

  /* ---------------------------------------------------------------- render / open / close */
  function render(fresh) {
    body.innerHTML = ""; setFoot(null); chain = Promise.resolve();
    if (fresh || !S.tok || S.step === "intro") { S.msgs = []; showIntro(); return; }
    // restore a chat in progress: replay the saved lines, then show the controls of the current step
    var saved = S.msgs.slice(); S.msgs = [];
    saved.forEach(function (m) { addMsg(m.w, m.h); });
    var st = S.step;
    if (st === "interest") {
      optionButtons([["phone", T.oPhone], ["distributor", T.oDist]], function (v, label) {
        user(label); S.branch = v; save(); sendStep("interest", v);
        if (v === "phone") { bot(esc(T.aPhone)); askMessage(); } else { askCountry(); }
      });
    }
    else if (st === "country") { S.msgs.pop(); save(); askCountry(); }
    else if (st === "company") { S.msgs.pop(); save(); askCompany(); }
    else if (st === "sells") { S.msgs.pop(); save(); askSells(); }
    else if (st === "industries") { S.msgs.pop(); save(); askIndustries(); }
    else if (st === "zone1") { S.msgs.pop(); save(); askZone1(); }
    else if (st === "message") { S.msgs.pop(); save(); askMessage(); }
    else if (st === "done") {
      var again = el("button", "smc-btn smc-btn--ghost smc-btn--block", esc(T.again)); again.type = "button";
      again.addEventListener("click", function () { S = { tok: "", name: "", email: "", step: "intro", branch: "", msgs: [], open: true }; save(); render(true); });
      setFoot(again);
    }
  }
  function openChat() {
    S.open = true; save();
    panel.hidden = false; fab.hidden = true; fab.setAttribute("aria-expanded", "true");
    if (!body.childNodes.length) render(false);
    setTimeout(function () {
      var target = panel.querySelector(".smc-foot input, .smc-foot select, .smc-foot textarea, .smc-foot button, .smc-card input");
      (target || panel.querySelector(".smc-x")).focus({ preventScroll: true });
    }, 60);
  }
  function closeChat() {
    S.open = false; save();
    panel.hidden = true; fab.hidden = false; fab.setAttribute("aria-expanded", "false");
    fab.focus({ preventScroll: true });
  }

  /* ---------------------------------------------------------------- build */
  function build() {
    var link = document.createElement("link"); link.rel = "stylesheet"; link.href = CSS; document.head.appendChild(link);
    root = el("div"); root.id = "samsChat"; root.setAttribute("data-lang", lang);
    if (lang === "ar") root.setAttribute("dir", "rtl");
    var icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z"/></svg>';
    fab = el("button", "smc-fab", icon + "<span>" + esc(T.launch) + "</span>");
    fab.type = "button"; fab.setAttribute("aria-haspopup", "dialog"); fab.setAttribute("aria-expanded", "false");
    panel = el("div", "smc-panel"); panel.hidden = true;
    panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", T.launch);
    panel.innerHTML = '<div class="smc-head"><div class="smc-head__dot">' + icon + '</div><div class="smc-head__t"><strong>' + esc(T.launch) + "</strong><span>" +
      esc(T.sub) + '</span></div><button class="smc-x" type="button" aria-label="' + esc(T.close) + '">&times;</button></div>' +
      '<div class="smc-body" role="log" aria-live="polite"></div><div class="smc-foot"></div>';
    root.appendChild(fab); root.appendChild(panel); document.body.appendChild(root);
    /* fit the VISIBLE screen: if the page is wider than the screen, fixed boxes would hang off the right edge */
    function fit() {
      var vv = window.visualViewport; if (!vv) return;
      var zoomed = vv.scale > 1.01, cw = window.innerWidth;
      if (zoomed || cw <= vv.width + 1) { root.style.removeProperty("--smc-rg"); root.style.removeProperty("--smc-vw"); return; }
      root.style.setProperty("--smc-rg", Math.max(0, cw - (vv.offsetLeft + vv.width)) + "px");
      root.style.setProperty("--smc-vw", vv.width + "px");
    }
    fit();
    if (window.visualViewport) { window.visualViewport.addEventListener("resize", fit); window.visualViewport.addEventListener("scroll", fit); }
    window.addEventListener("resize", fit);
    body = panel.querySelector(".smc-body"); foot = panel.querySelector(".smc-foot");
    fab.addEventListener("click", openChat);
    panel.querySelector(".smc-x").addEventListener("click", closeChat);
    panel.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.stopPropagation(); closeChat(); } });
    document.addEventListener("click", function (e) {      // any link/button on the page can open it: <a href="#talk-to-sams">
      var a = e.target.closest && e.target.closest('a[href="#talk-to-sams"], [data-sams-chat]');
      if (a) { e.preventDefault(); openChat(); }
    });
    if (S.open && S.tok && S.step !== "done") openChat();
  }

  function start() { try { build(); } catch (e) { /* the chat must never break a page */ } }
  if (document.readyState !== "loading") start(); else document.addEventListener("DOMContentLoaded", start);
})();
