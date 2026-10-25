import { QuizQuestion } from '../types';

export const SAMPLE_JLPT_N3_QUESTIONS: QuizQuestion[] = [
  // 1. NGỮ PHÁP THỰC CHIẾN: MONDAI 3 DẤU SAO ★ & MONDAI 4 ĐỤC LỖ ĐOẠN VĂN
  {
    id: 'q_grammar_star_1',
    category: 'grammar',
    subCategory: 'Mondai 3 · Sắp xếp câu dấu sao ★',
    title: 'Vận dụng mẫu câu từ OnTapNguPhap trong dạng bài dấu sao',
    questionText: '彼女は歌が ＿＿＿ ★ ＿＿＿ ＿＿＿ 歌手になりたいそうだ。',
    options: ['上手な', 'だけでなく', 'ピアノも弾けるので', '本当に'],
    correctAnswerIndex: 1,
    explanation:
      'Cấu trúc 「A だけでなく B も」 (Không những A mà còn B). Câu hoàn chỉnh: 「彼女は歌が 【上手な】 ★【だけでなく】 【ピアノも弾けるので】 【本当に】 歌手になりたいそうだ。」',
    usedTargets: [
      {
        type: 'grammar',
        id: 'g_203',
        title: '〜だけでなく〜も',
        readingOrStructure: 'V / A / N + だけでなく、〜も',
        meaning: 'Không những... mà còn...',
        level: 2,
        note: 'Tương đương với 〜ばかりでなく.',
      },
    ],
  },
  {
    id: 'q_grammar_star_2',
    category: 'grammar',
    subCategory: 'Mondai 3 · Sắp xếp câu dấu sao ★',
    title: 'Kết hợp Từ vựng & Ngữ pháp đang ôn (Lv1–Lv3)',
    questionText: '田中さんは、本当は全部知っているのに、＿＿＿ ★ ＿＿＿ ＿＿＿ 振る舞っている。',
    options: ['かのように', 'まるで', '知らなかった', '何も'],
    correctAnswerIndex: 3,
    explanation:
      'Cấu trúc 「まるで〜かのように」 (Cứ như thể là...). Câu hoàn chỉnh: 「田中さんは、本当は全部知っているのに、【まるで】 ★【何も】 【知らなかった】 【かのように】 振る舞っている。」 (Dù thực sự biết hết nhưng anh Tanaka lại cư xử cứ như thể chẳng biết gì cả). Vị trí dấu ★ là 「何も」.',
    usedTargets: [
      {
        type: 'grammar',
        id: 'g_204',
        title: 'まるで〜かのように',
        readingOrStructure: 'まるで + V / N + かのように',
        meaning: 'Cứ như thể là... (so sánh ví von điều không có thật)',
        level: 1,
        note: 'Đi kèm phó từ まるで ở đầu vế.',
      },
    ],
  },
  {
    id: 'q_grammar_mondai4_1',
    category: 'grammar',
    subCategory: 'Mondai 4 · Ngữ pháp trong đoạn văn (Đục lỗ)',
    title: 'Điền cấu trúc ngữ pháp phù hợp vào mạch đoạn văn',
    passage: `仕事が忙しい日が続くと、つい夜遅くにラーメンや甘いものを食べたくなってしまう。しかし、医者から「今の（ 1 ）、生活習慣を改めないと病気になりますよ」と注意された。それ以来、どんなにストレスがたまっても、夜10時以降は我慢して何も（ 2 ）。`,
    questionText: 'Vị trí ( 1 ) và ( 2 ) lần lượt điền tổ hợp nào để đúng mạch văn?',
    options: [
      '(1) うちに  ·  (2) 食べないようにしている',
      '(1) おかげで  ·  (2) 食べるようになっている',
      '(1) にもかかわらず  ·  (2) 食べないことに決まった',
      '(1) あいだに  ·  (2) 食べるようにしている',
    ],
    correctAnswerIndex: 0,
    explanation:
      'Ở (1): 「今のうちに」 = Nhân lúc bây giờ (trước khi đổ bệnh). Ở (2): 「食べないようにしている」 = Cố gắng duy trì thói quen không ăn sau 10 giờ tối, kết hợp cùng từ vựng 「我慢」(kiên nhẫn/nhẫn nại) trong kho từ của bạn.',
    usedTargets: [
      {
        type: 'grammar',
        id: 'g_202',
        title: '〜うちに',
        readingOrStructure: 'Vる / Vない / Nの + うちに',
        meaning: 'Nhân lúc còn... (trước khi trạng thái thay đổi)',
        level: 2,
      },
      {
        type: 'grammar',
        id: 'g_205',
        title: '〜ようにする',
        readingOrStructure: 'Vる / Vない + ようにする',
        meaning: 'Cố gắng duy trì thói quen làm/không làm gì',
        level: 3,
      },
      {
        type: 'vocab',
        id: 'v_101',
        title: '我慢',
        readingOrStructure: 'がまん',
        meaning: 'Kiên nhẫn, chịu đựng',
        level: 1,
      },
    ],
  },

  // 2. TỪ VỰNG NÂNG CAO: TỪ ĐỒNG NGHĨA & CÁCH DÙNG TỪ TRONG CÂU
  {
    id: 'q_vocab_synonym_1',
    category: 'vocabulary',
    subCategory: 'Mondai 3 · Tìm từ đồng nghĩa / Gần nghĩa nhất',
    title: 'Từ đồng nghĩa từ kho OnTapTuVung (Lv1–Lv2)',
    questionText: '明日の会議のスケジュールが急に【変更】になりました。',
    options: ['変わりました', '決まりました', '終わりました', '延びました'],
    correctAnswerIndex: 0,
    explanation:
      '【変更】(へんこう - Thay đổi, điều chỉnh lịch trình) đồng nghĩa trực tiếp với 「変わりました」(đã thay đổi).',
    usedTargets: [
      {
        type: 'vocab',
        id: 'v_103',
        title: '変更',
        readingOrStructure: 'へんこう',
        meaning: 'Thay đổi, điều chỉnh',
        level: 2,
      },
    ],
  },
  {
    id: 'q_vocab_usage_1',
    category: 'vocabulary',
    subCategory: 'Mondai 4 · Cách dùng từ đúng trong ngữ cảnh (用法)',
    title: 'Chọn câu sử dụng đúng từ 【我慢】 (Lv1)',
    questionText: 'つぎの【我慢（がまん）】を使った文として、最もよいものを一つ選びなさい。',
    options: [
      '歯が痛かったが、大事な会議が終わるまで我慢した。',
      'この新しいパソコンは性能がよくて、とても我慢できる。',
      '天気が悪かったので、明日の旅行を来週に我慢した。',
      '毎朝6時に起きるように、目覚まし時計を我慢している。',
    ],
    correctAnswerIndex: 0,
    explanation:
      '「我慢する」(がまんする) nghĩa là chịu đựng cơn đau, sự khó chịu hoặc kìm nén cảm xúc/ham muốn. Câu 1 đúng: "Dù bị đau răng nhưng tôi đã cố chịu đựng cho đến khi cuộc họp quan trọng kết thúc".',
    usedTargets: [
      {
        type: 'vocab',
        id: 'v_101',
        title: '我慢',
        readingOrStructure: 'がまん',
        meaning: 'Kiên nhẫn, chịu đựng, nhẫn nại',
        level: 1,
      },
    ],
  },
  {
    id: 'q_vocab_usage_2',
    category: 'vocabulary',
    subCategory: 'Mondai 4 · Cách dùng từ đúng trong ngữ cảnh (用法)',
    title: 'Chọn câu sử dụng đúng phó từ 【のんびり】 (Lv1)',
    questionText: 'つぎの【のんびり】を使った文として、最もよいものを一つ選びなさい。',
    options: [
      '休日は静かな温泉に行って、のんびり過ごしたい。',
      '終電に間に合わないので、駅までのんびり走った。',
      '試験の前の日は、夜遅くまでのんびり勉強して疲れた。',
      '部長に書類の間違いをのんびり確認してもらった。',
    ],
    correctAnswerIndex: 0,
    explanation:
      '「のんびり」diễn tả trạng thái thư thái, thong thả, không vội vã hay áp lực. Câu 1 chính xác: "Ngày nghỉ tôi muốn đi suối nước nóng yên tĩnh và tận hưởng thời gian thảnh thơi".',
    usedTargets: [
      {
        type: 'vocab',
        id: 'v_104',
        title: 'のんびり',
        readingOrStructure: 'のんびり',
        meaning: 'Thong thả, thư thái, thảnh thơi',
        level: 1,
      },
    ],
  },

  // 3. BÀI ĐỌC HIỂU (ĐOẢN / TRUNG VĂN) LỒNG GHÉP TỪ & NGỮ PHÁP ĐÃ HỌC
  {
    id: 'q_reading_integrated_1',
    category: 'reading',
    subCategory: 'Đọc hiểu Trung văn · Lồng ghép Từ & Ngữ pháp đang học',
    title: 'Bài đọc tích hợp: 効率 (Lv3), のんびり (Lv1), 〜にもかかわらず (Lv1), 〜うちに (Lv2)',
    passage: `現代の社会では、仕事の【効率】を上げることが何よりも重視されている。スマートフォンや便利なアプリのおかげで、どこにいても連絡を【確認】できるようになった。
しかし、便利になった【にもかかわらず】、以前より「時間がない」と感じる人が増えているのはなぜだろうか。それは、少しずつ空いた時間まで仕事や情報収集に使ってしまうからではないか。
若い【うちに】一生懸命働くことも大切だが、たまにはスマートフォンの電源を切って、自然の中で【のんびり】過ごす時間を作るようにしたいものだ。そのような時間こそが、かえって明日への活力を生み出すのだから。`,
    questionText: 'この文章で筆者が最も言いたいことは何か。',
    options: [
      '仕事の効率を上げるためには、常にスマートフォンで連絡を確認するべきだ。',
      '便利な時代だからこそ、意識してのんびり休む時間を作ることが大切だ。',
      '若いうちは休まずに働いて、年を取ってからのんびり過ごせばよい。',
      'スマートフォンのアプリは仕事の効率を下げるので、使わないほうがよい。',
    ],
    correctAnswerIndex: 1,
    explanation:
      'Bài đọc lồng ghép 4 từ/ngữ pháp mục tiêu từ lịch sử của bạn: 【効率】(hiệu suất), 【確認】(xác nhận), 【〜にもかかわらず】(mặc dù... nhưng), 【〜うちに】(nhân lúc còn...), 【のんびり】(thong thả). Ý chính của tác giả nằm ở đoạn cuối: Dù bận rộn và tiện lợi nhưng cần chủ động tắt điện thoại, dành thời gian nghỉ ngơi thư thái (のんびり過ごす時間を作る) để tái tạo năng lượng.',
    usedTargets: [
      {
        type: 'vocab',
        id: 'v_106',
        title: '効率',
        readingOrStructure: 'こうりつ',
        meaning: 'Hiệu suất, năng suất',
        level: 3,
      },
      {
        type: 'vocab',
        id: 'v_104',
        title: 'のんびり',
        readingOrStructure: 'のんびり',
        meaning: 'Thong thả, thư thái',
        level: 1,
      },
      {
        type: 'grammar',
        id: 'g_201',
        title: '〜にもかかわらず',
        readingOrStructure: 'V / A / N + にもかかわらず',
        meaning: 'Mặc dù... thế nhưng vẫn...',
        level: 1,
      },
      {
        type: 'grammar',
        id: 'g_202',
        title: '〜うちに',
        readingOrStructure: 'V / A / Nの + うちに',
        meaning: 'Nhân lúc còn...',
        level: 2,
      },
    ],
  },

  // 4. HỘI THOẠI NGHE HIỂU CHỨA TỪ VỰNG VÀ CẤU TRÚC VỪA ÔN
  {
    id: 'q_listening_integrated_1',
    category: 'listening',
    subCategory: 'Choukai Mondai 1 · Hội thoại tích hợp từ & ngữ pháp đang ôn',
    title: 'Nghe hiểu lồng ghép: 変更 (Lv2), 確認 (Lv2), 〜うちに (Lv2), 〜だけでなく (Lv2)',
    listeningScript: `会社で女の人と男の人が話しています。男の人はこのあと、まず何をしますか。

女：佐藤さん、来週のセミナーですが、会場が急に変更になったのを知っていますか？
男：えっ、そうなんですか？第1会議室じゃなくなったんですか？
女：ええ。参加者が増えたので、3階のホールになったんです。会場だけでなく、開始時間も30分早まりましたよ。
男：それは知りませんでした。
女：じゃあ、忘れないうちに、まず参加者に送る案内メールの内容を直して、私に確認させてください。会場の準備は午後からで大丈夫ですから。
男：わかりました。すぐにメールの文面を直してきます。`,
    questionText: '男の人はこのあと、まず何をしますか。',
    options: [
      '3階のホールの準備をする',
      '案内メールの内容を直して女の人に確認してもらう',
      '第1会議室を予約し直す',
      'セミナーの開始時間を30分遅らせる',
    ],
    correctAnswerIndex: 1,
    explanation:
      'Đoạn hội thoại cài cắm trực tiếp các từ vựng và cấu trúc bạn đang ôn: 【変更】(thay đổi), 【〜だけでなく】(không chỉ... mà còn), 【忘れないうちに】(nhân lúc chưa quên), 【確認】(xác nhận). Người nữ dặn: 「忘れないうちに、まず参加者に送る案内メールの内容を直して、私に確認させてください」 (Nhân lúc chưa quên, trước hết hãy sửa nội dung email thông báo rồi đưa tôi xác nhận).',
    usedTargets: [
      {
        type: 'vocab',
        id: 'v_103',
        title: '変更',
        readingOrStructure: 'へんこう',
        meaning: 'Thay đổi, điều chỉnh',
        level: 2,
      },
      {
        type: 'vocab',
        id: 'v_102',
        title: '確認',
        readingOrStructure: 'かくにん',
        meaning: 'Xác nhận, kiểm tra',
        level: 2,
      },
      {
        type: 'grammar',
        id: 'g_202',
        title: '〜うちに',
        readingOrStructure: 'Vない + うちに',
        meaning: 'Nhân lúc chưa / còn...',
        level: 2,
      },
      {
        type: 'grammar',
        id: 'g_203',
        title: '〜だけでなく〜も',
        readingOrStructure: 'N + だけでなく',
        meaning: 'Không chỉ... mà còn...',
        level: 2,
      },
    ],
  },
];
