import React, { createContext, useContext, useState, ReactNode } from "react";

export type Language = "vi" | "en" | "zh" | "ko" | "ja";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  languages: Array<{
    code: Language;
    name: string;
    nativeName: string;
    flag: string;
  }>;
}

type TranslationKeys = Record<string, string>;

// Translation dictionaries
const translations: Record<Language, TranslationKeys> = {
  vi: {
    // Navigation
    "nav.home": "Trang chủ",
    "nav.stories": "Truyện",
    "nav.audio": "Audio",
    "nav.genres": "Thể loại",
    "nav.help": "Trợ giúp",
    "nav.contact": "Liên hệ",
    "nav.login": "Đăng nhập",
    "nav.register": "Đăng ký",
    "nav.logout": "Đăng xuất",
    "nav.bookmarks": "Đánh dấu",
    "nav.admin": "Admin",
    "nav.search.placeholder": "Tìm kiếm truyện...",

    // Common
    "common.loading": "Đang tải...",
    "common.error": "Có lỗi xảy ra",
    "common.no_data": "Không có dữ liệu",
    "common.view_all": "Xem tất cả",
    "common.read_more": "Đọc thêm",
    "common.read_now": "Đọc ngay",
    "common.listen_now": "Nghe ngay",
    "common.author": "Tác giả",
    "common.chapter": "Chương",
    "common.chapters": "Chương",
    "common.views": "Lượt xem",
    "common.bookmarks": "Lượt đánh dấu",
    "common.status": "Trạng thái",
    "common.genre": "Thể loại",
    "common.type": "Loại",
    "common.published": "Đã xuất bản",
    "common.draft": "Bản nháp",
    "common.hidden": "Ẩn",
    "common.completed": "Hoàn thành",
    "common.ongoing": "Đang tiến hành",
    "common.text": "Văn bản",
    "common.audio": "Audio",

    // Home page
    "home.hero.title": "Khám phá thế giới điện ảnh",
    "home.hero.subtitle": "Review phim, phân tích nội dung chuyên sâu và gợi ý phim hay mỗi ngày",
    "home.hero.cta": "Xem Review",
    "home.featured.text": "Truyện văn bản mới nhất",
    "home.featured.audio": "Truyện audio nổi bật",
    "home.featured.recent": "Vừa cập nhật",
    "home.trending": "Trending",
    "home.categories": "Danh mục",
    "home.most_viewed": "Xem nhiều nhất",
    "home.newest": "Mới nhất",
    "home.completed_stories": "Truyện hoàn thành",
    "home.ongoing_stories": "Đang cập nhật",

    // Stories page
    "stories.title": "The Midnight Movie Reel",
    "stories.filter.all": "Tất cả",
    "stories.filter.text": "Văn bản",
    "stories.filter.audio": "Audio",
    "stories.sort.newest": "Mới nhất",
    "stories.sort.oldest": "Cũ nhất",
    "stories.sort.views": "Lượt xem",
    "stories.sort.title": "Tên truyện",
    "stories.no_stories": "Không tìm thấy truyện nào",
    "stories.search_results": "Kết quả tìm kiếm cho",

    // Genres page
    "genres.title": "Thể Loại Truyện",
    "genres.subtitle":
      "Khám phá các thể loại truyện đa dạng và phong phú. Tìm kiếm những câu chuyện phù hợp với sở thích của bạn.",
    "genres.no_genres": "Chưa có thể loại nào",
    "genres.cta.title": "Không tìm thấy thể loại yêu thích?",
    "genres.cta.subtitle":
      "Khám phá tất cả các truyện trong kho tàng của chúng tôi",
    "genres.cta.button": "Xem Tất Cả Truyện",

    // Admin
    "admin.dashboard": "Bảng điều khiển",
    "admin.role": "Quản trị viên",
    "admin.stats.title": "Thống kê tổng quan",
    "admin.stats.total_users": "Tổng người dùng",
    "admin.stats.total_stories": "Tổng truyện",
    "admin.stats.total_chapters": "Tổng chương",
    "admin.stats.total_views": "Tổng lượt xem",
    "admin.stats.new_users_today": "Người dùng mới hôm nay",
    "admin.stats.stories_published_today": "Truyện xuất bản hôm nay",
    "admin.stats.active_users": "Người dùng hoạt động",
    "admin.stats.recent_activities": "Hoạt động gần đây",
    "admin.stats.top_stories": "Truyện hàng đầu",
    "admin.stats.user_registrations": "Đăng ký người dùng",
    "admin.stats.story_views": "Lượt xem truyện",
    "admin.stats.comments": "Bình luận",
    "admin.stats.bookmarks": "Đánh dấu",

    // Stories Management
    "admin.stories.title": "Quản lý truyện",
    "admin.stories.create_new": "Tạo truyện mới",
    "admin.stories.search": "Tìm kiếm",
    "admin.stories.search_placeholder": "Tìm tên truyện hoặc tác giả...",
    "admin.stories.refresh": "Làm mới",
    "admin.stories.story": "Truyện",
    "admin.stories.stats": "Thống kê",
    "admin.stories.actions": "Hành động",
    "admin.stories.confirm_delete": "Bạn có chắc muốn xóa truyện này?",
    "admin.stories.delete_error": "Lỗi khi xóa truyện",
    "admin.stories.no_results": "Không tìm thấy truyện phù hợp",
    "admin.stories.no_stories": "Chưa có truyện nào",
    "admin.stories.unknown_author": "Tác giả không xác định",

    // Media Management
    "admin.media.title": "Quản lý media",
    "admin.media.upload": "Tải lên",
    "admin.media.search": "Tìm kiếm",
    "admin.media.search_placeholder": "Tìm tên file...",
    "admin.media.type": "Loại file",
    "admin.media.refresh": "Làm mới",
    "admin.media.filter.all": "Tất cả",
    "admin.media.filter.image": "Hình ảnh",
    "admin.media.filter.audio": "Audio",
    "admin.media.filter.document": "Tài liệu",
    "admin.media.delete": "Xóa",
    "admin.media.copy_url": "Copy URL",
    "admin.media.confirm_delete": "Bạn có chắc muốn xóa file này?",
    "admin.media.delete_error": "Lỗi khi xóa file",
    "admin.media.no_results": "Không tìm thấy file phù hợp",
    "admin.media.no_files": "Chưa có file nào",
    "admin.media.upload_files": "Tải lên files",
    "admin.media.select_files": "Chọn files",
    "admin.media.selected_files": "Files đã chọn",
    "admin.media.uploading": "Đang tải lên...",
    "admin.media.upload_error": "Lỗi khi tải lên file",

    // Users Management
    "admin.users.title": "Quản lý người dùng",
    "admin.users.create_new": "Tạo người dùng mới",
    "admin.users.search": "Tìm kiếm",
    "admin.users.search_placeholder": "Tìm tên, email hoặc username...",
    "admin.users.refresh": "Làm mới",
    "admin.users.total_users": "Tổng người dùng",
    "admin.users.active_users": "Người dùng hoạt động",
    "admin.users.new_users": "Người dùng mới",
    "admin.users.premium_users": "Người dùng VIP",
    "admin.users.user": "Người dùng",
    "admin.users.role": "Vai trò",
    "admin.users.status": "Trạng thái",
    "admin.users.activity": "Hoạt động",
    "admin.users.stats": "Thống kê",
    "admin.users.actions": "Hành động",
    "admin.users.confirm_delete": "Bạn có chắc muốn xóa người dùng này?",
    "admin.users.no_results": "Không tìm thấy người dùng phù hợp",
    "admin.users.no_users": "Chưa có người dùng nào",
    "admin.users.all_roles": "Tất cả vai trò",
    "admin.users.role_admin": "Quản trị viên",
    "admin.users.role_premium": "VIP",
    "admin.users.role_user": "Người dùng",
    "admin.users.all_statuses": "Tất cả trạng thái",
    "admin.users.status_active": "Hoạt động",
    "admin.users.status_inactive": "Không hoạt động",
    "admin.users.status_banned": "Bị cấm",

    // Media Upload
    "admin.media.title1": "Quản lý tệp tin",
    "admin.media.upload_title": "Tải lên tệp tin",
    "admin.media.upload_description": "Kéo thả hoặc click để chọn tệp",
    "admin.media.select_files1": "Chọn tệp tin",
    "admin.media.browse_files": "Duyệt tệp",
    "admin.media.supported_formats": "Định dạng hỗ trợ",
    "admin.media.max_file_size": "Kích thước tối đa",
    "admin.media.drag_drop_hint": "Kéo và thả tệp vào đây",
    "admin.media.uploading1": "Đang tải lên...",
    "admin.media.upload_success": "Tải lên thành công!",
    "admin.media.upload_error1": "Lỗi tải lên",
    "admin.media.remove_file": "Xóa tệp",
    "admin.media.recent_uploads": "Tệp tải lên gần đây",
    "admin.media.no_files1": "Chưa có tệp nào được tải lên",
    "admin.media.file_too_large": "Tệp quá lớn",
    "admin.media.invalid_format": "Định dạng không hỗ trợ",

    // System Settings
    "admin.settings.title": "Cài đặt hệ thống",
    "admin.settings.save": "Lưu cài đặt",
    "admin.settings.saving": "Đang lưu...",
    "admin.settings.save_success": "Cài đặt đã được lưu thành công!",
    "admin.settings.save_error": "Lỗi khi lưu cài đặt",
    "admin.settings.general": "Cài đặt chung",
    "admin.settings.features": "Tính năng",
    "admin.settings.social": "Mạng xã hội",
    "admin.settings.seo": "SEO",
    "admin.settings.advanced": "Nâng cao",
    "admin.settings.site_name": "Tên website",
    "admin.settings.site_description": "Mô tả website",
    "admin.settings.contact_email": "Email liên hệ",
    "admin.settings.enable_registration": "Cho phép đăng ký",
    "admin.settings.enable_registration_desc":
      "Người dùng có thể tạo tài khoản mới",
    "admin.settings.enable_comments": "Cho phép bình luận",
    "admin.settings.enable_comments_desc":
      "Người dùng có thể bình luận trên truyện",
    "admin.settings.enable_bookmarks": "Cho phép đánh dấu",
    "admin.settings.enable_bookmarks_desc":
      "Người dùng có thể đánh dấu truyện yêu thích",
    "admin.settings.maintenance_mode": "Chế độ bảo trì",
    "admin.settings.maintenance_mode_desc":
      "Website sẽ hiển thị trang bảo trì cho người dùng",
    "admin.settings.meta_title": "Tiêu đề meta",
    "admin.settings.meta_description": "Mô tả meta",
    "admin.settings.keywords": "Từ khóa SEO",
    "admin.settings.add_keyword": "Nhấn Enter để thêm từ khóa...",
    "admin.settings.max_file_size": "Kích thước tệp tối đa",
    "admin.settings.allowed_file_types": "Loại tệp cho phép",
    "admin.settings.add_file_type": "Nhấn Enter để thêm loại tệp...",

    // Enhanced Stories
    "stories.total_found": "Tìm thấy",
    "stories.stories": "truyện",
    "stories.filters": "Bộ lọc",
    "stories.advanced_filters": "Bộ lọc nâng cao",
    "stories.clear_all": "Xóa tất cả",
    "stories.search_title": "Tìm theo tên truyện",
    "stories.search_placeholder": "Nhập tên truyện...",
    "stories.search_author": "Tìm theo tác giả",
    "stories.author_placeholder": "Nhập tên tác giả...",
    "stories.type": "Loại truyện",
    "stories.all_types": "Tất cả loại",
    "stories.text_stories": "Truyện chữ",
    "stories.audio_stories": "Truyện audio",
    "stories.status": "Trạng thái",
    "stories.all_statuses": "Tất cả trạng thái",
    "stories.published": "Đã xuất bản",
    "stories.draft": "Bản nháp",
    "stories.sort_by": "Sắp xếp theo",
    "stories.sort_newest": "Mới nhất",
    "stories.sort_oldest": "Cũ nhất",
    "stories.sort_popular": "Phổ biến",
    "stories.sort_views": "Lượt xem",
    "stories.sort_title": "Tên truyện",
    "stories.min_chapters": "Số chương tối thiểu",
    "stories.genres": "Thể loại",
    "stories.selected": "đã chọn",
    "stories.no_stories_found": "Không tìm thấy truyện nào",
    "stories.try_different_filters": "Hãy thử sử dụng bộ lọc khác",
    "stories.clear_filters": "Xóa bộ lọc",
    "common.previous": "Trước",
    "common.next": "Tiếp",

    // Theme
    "theme.light": "Chế độ sáng",
    "theme.dark": "Chế độ tối",

    // Language
    "language.vietnamese": "Tiếng Việt",
    "language.english": "English",
    "language.chinese": "中文",
    "language.korean": "한국어",
    "language.japanese": "日本語",
  },
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.stories": "Stories",
    "nav.audio": "Audio",
    "nav.genres": "Genres",
    "nav.help": "Help",
    "nav.contact": "Contact",
    "nav.login": "Login",
    "nav.register": "Register",
    "nav.logout": "Logout",
    "nav.bookmarks": "Bookmarks",
    "nav.admin": "Admin",
    "nav.search.placeholder": "Search stories...",

    // Common
    "common.loading": "Loading...",
    "common.error": "An error occurred",
    "common.no_data": "No data available",
    "common.view_all": "View all",
    "common.read_more": "Read more",
    "common.read_now": "Read now",
    "common.listen_now": "Listen now",
    "common.author": "Author",
    "common.chapter": "Chapter",
    "common.chapters": "Chapters",
    "common.views": "Views",
    "common.bookmarks": "Bookmarks",
    "common.status": "Status",
    "common.genre": "Genre",
    "common.type": "Type",
    "common.published": "Published",
    "common.draft": "Draft",
    "common.hidden": "Hidden",
    "common.completed": "Completed",
    "common.ongoing": "Ongoing",
    "common.text": "Text",
    "common.audio": "Audio",

    // Home page
    "home.hero.title": "Discover the World of Stories",
    "home.hero.subtitle":
      "Thousands of captivating stories waiting for you to explore",
    "home.hero.cta": "Start Reading",
    "home.featured.text": "Latest Text Stories",
    "home.featured.audio": "Featured Audio Stories",
    "home.featured.recent": "Recently Updated",
    "home.trending": "Trending",
    "home.categories": "Categories",
    "home.most_viewed": "Most Viewed",
    "home.newest": "Newest",
    "home.completed_stories": "Completed Stories",
    "home.ongoing_stories": "Ongoing Stories",

    // Stories page
    "stories.title": "Story Library",
    "stories.filter.all": "All",
    "stories.filter.text": "Text",
    "stories.filter.audio": "Audio",
    "stories.sort.newest": "Newest",
    "stories.sort.oldest": "Oldest",
    "stories.sort.views": "Views",
    "stories.sort.title": "Title",
    "stories.no_stories": "No stories found",
    "stories.search_results": "Search results for",

    // Genres page
    "genres.title": "Story Genres",
    "genres.subtitle":
      "Explore diverse and rich story genres. Find stories that suit your preferences.",
    "genres.no_genres": "No genres available",
    "genres.cta.title": "Can't find your favorite genre?",
    "genres.cta.subtitle": "Explore all stories in our collection",
    "genres.cta.button": "View All Stories",

    // Theme
    "theme.light": "Light Mode",
    "theme.dark": "Dark Mode",

    // Language
    "language.vietnamese": "Tiếng Việt",
    "language.english": "English",
    "language.chinese": "中文",
    "language.korean": "한국어",
    "language.japanese": "日本語",
  },
  zh: {
    // Navigation
    "nav.home": "首页",
    "nav.stories": "小说",
    "nav.audio": "有声读物",
    "nav.genres": "分类",
    "nav.help": "帮助",
    "nav.contact": "联系",
    "nav.login": "登录",
    "nav.register": "注册",
    "nav.logout": "退出",
    "nav.bookmarks": "书签",
    "nav.admin": "管理",
    "nav.search.placeholder": "搜索小说...",

    // Common
    "common.loading": "加载中...",
    "common.error": "发生错误",
    "common.no_data": "暂无数据",
    "common.view_all": "查看全部",
    "common.read_more": "阅读更多",
    "common.read_now": "立即阅读",
    "common.listen_now": "立即收听",
    "common.author": "作者",
    "common.chapter": "章节",
    "common.chapters": "章节",
    "common.views": "浏览量",
    "common.bookmarks": "收藏",
    "common.status": "状态",
    "common.genre": "类型",
    "common.type": "形式",
    "common.published": "已发布",
    "common.draft": "草稿",
    "common.hidden": "隐藏",
    "common.completed": "完结",
    "common.ongoing": "连载中",
    "common.text": "文字",
    "common.audio": "音频",

    // Home page
    "home.hero.title": "探索小说世界",
    "home.hero.subtitle": "数千个精彩故事等待您的发现",
    "home.hero.cta": "开始阅读",
    "home.featured.text": "最新文字小说",
    "home.featured.audio": "精选有声读物",
    "home.featured.recent": "最近更新",
    "home.trending": "热门",
    "home.categories": "分类",
    "home.most_viewed": "最多浏览",
    "home.newest": "最新",
    "home.completed_stories": "完结小说",
    "home.ongoing_stories": "连载中",

    // Stories page
    "stories.title": "小说库",
    "stories.filter.all": "全部",
    "stories.filter.text": "文字",
    "stories.filter.audio": "音频",
    "stories.sort.newest": "最新",
    "stories.sort.oldest": "最早",
    "stories.sort.views": "浏览量",
    "stories.sort.title": "标题",
    "stories.no_stories": "未找到小说",
    "stories.search_results": "搜索结果",

    // Genres page
    "genres.title": "小说分类",
    "genres.subtitle": "探索丰富多样的小说类型，找到适合您喜好的故事。",
    "genres.no_genres": "暂无分类",
    "genres.cta.title": "找不到喜欢的类型？",
    "genres.cta.subtitle": "探索我们收藏的所有小说",
    "genres.cta.button": "查看全部小说",

    // Theme
    "theme.light": "浅色模式",
    "theme.dark": "深色模式",

    // Language
    "language.vietnamese": "Tiếng Việt",
    "language.english": "English",
    "language.chinese": "中文",
    "language.korean": "한국어",
    "language.japanese": "日本語",
  },
  ko: {
    // Navigation
    "nav.home": "홈",
    "nav.stories": "소설",
    "nav.audio": "오디오북",
    "nav.genres": "장르",
    "nav.help": "도움말",
    "nav.contact": "연락처",
    "nav.login": "로그인",
    "nav.register": "회원가입",
    "nav.logout": "로그아웃",
    "nav.bookmarks": "북마크",
    "nav.admin": "관리자",
    "nav.search.placeholder": "소설 검색...",

    // Common
    "common.loading": "로딩 중...",
    "common.error": "오류가 발생했습니다",
    "common.no_data": "데이터가 없습니다",
    "common.view_all": "모두 보기",
    "common.read_more": "더 읽기",
    "common.read_now": "지금 읽기",
    "common.listen_now": "지금 듣기",
    "common.author": "작가",
    "common.chapter": "챕터",
    "common.chapters": "챕터",
    "common.views": "조회수",
    "common.bookmarks": "북마크",
    "common.status": "상태",
    "common.genre": "장르",
    "common.type": "유형",
    "common.published": "출간됨",
    "common.draft": "초안",
    "common.hidden": "숨김",
    "common.completed": "완결",
    "common.ongoing": "연재중",
    "common.text": "텍스트",
    "common.audio": "오디오",

    // Home page
    "home.hero.title": "소설의 세계를 탐험하세요",
    "home.hero.subtitle":
      "수천 개의 매력적인 이야기가 여러분을 기다리고 있습니다",
    "home.hero.cta": "읽기 시작",
    "home.featured.text": "최신 텍스트 소설",
    "home.featured.audio": "추천 오디오북",
    "home.featured.recent": "최근 업데이트",
    "home.trending": "인기",
    "home.categories": "카테고리",
    "home.most_viewed": "최다 조회",
    "home.newest": "최신",
    "home.completed_stories": "완결 소설",
    "home.ongoing_stories": "연재 소설",

    // Stories page
    "stories.title": "소설 라이브러리",
    "stories.filter.all": "전체",
    "stories.filter.text": "텍스트",
    "stories.filter.audio": "오디오",
    "stories.sort.newest": "최신순",
    "stories.sort.oldest": "오래된순",
    "stories.sort.views": "조회수순",
    "stories.sort.title": "제목순",
    "stories.no_stories": "소설을 찾을 수 없습니다",
    "stories.search_results": "검색 결과",

    // Genres page
    "genres.title": "소설 장르",
    "genres.subtitle":
      "다양하고 풍부한 소설 장르를 탐험하세요. 취향에 맞는 이야기를 찾아보세요.",
    "genres.no_genres": "장르가 없습니다",
    "genres.cta.title": "좋아하는 장르를 찾을 수 없나요?",
    "genres.cta.subtitle": "우리 컬렉션의 모든 소설을 탐험해보세요",
    "genres.cta.button": "모든 소설 보기",

    // Theme
    "theme.light": "라이트 모드",
    "theme.dark": "다크 모드",

    // Language
    "language.vietnamese": "Tiếng Việt",
    "language.english": "English",
    "language.chinese": "中文",
    "language.korean": "한국어",
    "language.japanese": "日本語",
  },
  ja: {
    // Navigation
    "nav.home": "ホーム",
    "nav.stories": "小説",
    "nav.audio": "オーディオブック",
    "nav.genres": "ジャンル",
    "nav.help": "ヘルプ",
    "nav.contact": "お問い合わせ",
    "nav.login": "ログイン",
    "nav.register": "新規登録",
    "nav.logout": "ログアウト",
    "nav.bookmarks": "ブックマーク",
    "nav.admin": "管理者",
    "nav.search.placeholder": "小説を検索...",

    // Common
    "common.loading": "読み込み中...",
    "common.error": "エラーが発生しました",
    "common.no_data": "データがありません",
    "common.view_all": "すべて表示",
    "common.read_more": "もっと読む",
    "common.read_now": "今すぐ読む",
    "common.listen_now": "今すぐ聞く",
    "common.author": "作者",
    "common.chapter": "チャプター",
    "common.chapters": "チャプター",
    "common.views": "閲覧数",
    "common.bookmarks": "ブックマーク",
    "common.status": "ステータス",
    "common.genre": "ジャンル",
    "common.type": "タイプ",
    "common.published": "公開済み",
    "common.draft": "下書き",
    "common.hidden": "非表示",
    "common.completed": "完結",
    "common.ongoing": "連載中",
    "common.text": "テキスト",
    "common.audio": "オーディオ",

    // Home page
    "home.hero.title": "小説の世界を探索しよう",
    "home.hero.subtitle": "何千もの魅力的な物語があなたを待っています",
    "home.hero.cta": "読み始める",
    "home.featured.text": "最新テキスト小説",
    "home.featured.audio": "注目のオーディオブック",
    "home.featured.recent": "最近更新",
    "home.trending": "トレンド",
    "home.categories": "カテゴリー",
    "home.most_viewed": "最も閲覧",
    "home.newest": "最新",
    "home.completed_stories": "完結小説",
    "home.ongoing_stories": "連載小説",

    // Stories page
    "stories.title": "小説ライブラリ",
    "stories.filter.all": "すべて",
    "stories.filter.text": "テキスト",
    "stories.filter.audio": "オーディオ",
    "stories.sort.newest": "新しい順",
    "stories.sort.oldest": "古い順",
    "stories.sort.views": "閲覧数順",
    "stories.sort.title": "タイトル順",
    "stories.no_stories": "小説が見つかりません",
    "stories.search_results": "検索結果",

    // Genres page
    "genres.title": "小説ジャンル",
    "genres.subtitle":
      "多様で豊富な小説ジャンルを探索してください。お好みに合った物語を見つけましょう。",
    "genres.no_genres": "ジャンルがありません",
    "genres.cta.title": "お気に入りのジャンルが見つかりませんか？",
    "genres.cta.subtitle":
      "私たちのコレクションのすべての小説を探索してください",
    "genres.cta.button": "すべての小説を表示",

    // Theme
    "theme.light": "ライトモード",
    "theme.dark": "ダークモード",

    // Language
    "language.vietnamese": "Tiếng Việt",
    "language.english": "English",
    "language.chinese": "中文",
    "language.korean": "한국어",
    "language.japanese": "日本語",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

const languages: Array<{
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}> = [
    { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
    { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
    { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
    { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
    { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  ];

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>("vi");

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export default LanguageContext;
