-- MySQL 8+
-- Создаёт таблицы для лендинга + пользователей.

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cover (
  id TINYINT UNSIGNED NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  author_photo_path VARCHAR(512) NULL,
  stat_books VARCHAR(32) NOT NULL,
  stat_readers VARCHAR(32) NOT NULL,
  stat_rating VARCHAR(32) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS about (
  id TINYINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  image_path VARCHAR(512) NULL,
  paragraph_1 TEXT NOT NULL,
  paragraph_2 TEXT NOT NULL,
  paragraph_3 TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS achievements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_achievements_sort (sort_order, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS books (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  genre VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  rating DECIMAL(2,1) NOT NULL DEFAULT 0.0,
  cover_path VARCHAR(512) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_books_sort (sort_order, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  reviewer_name VARCHAR(255) NOT NULL,
  reviewer_location VARCHAR(255) NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  body TEXT NOT NULL,
  book_title VARCHAR(255) NOT NULL,
  avatar_path VARCHAR(512) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_reviews_sort (sort_order, id),
  CONSTRAINT chk_reviews_rating CHECK (rating >= 1 AND rating <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS footer (
  id TINYINT UNSIGNED NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(64) NOT NULL,
  vk_label VARCHAR(64) NOT NULL,
  vk_url VARCHAR(512) NOT NULL,
  tg_label VARCHAR(64) NOT NULL,
  tg_url VARCHAR(512) NOT NULL,
  ig_label VARCHAR(64) NOT NULL,
  ig_url VARCHAR(512) NOT NULL,
  copyright_text VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Один ряд для cover/about: id=1
INSERT INTO cover (id, author_name, subtitle, description, author_photo_path, stat_books, stat_readers, stat_rating)
VALUES
  (1, 'Имя Автора', 'Писатель, автор бестселлеров',
   'Добро пожаловать в мир моих произведений! Я создаю истории, которые трогают сердца и заставляют задуматься. Мои книги — это путешествие в мир эмоций, приключений и глубоких размышлений о жизни.',
   NULL, '15+', '100K+', '4.8')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO about (id, title, image_path, paragraph_1, paragraph_2, paragraph_3)
VALUES
  (1, 'Об авторе', NULL,
   'Меня зовут [Имя Автора], и я писатель с более чем [X] летним опытом создания литературных произведений. Моя страсть к писательству началась в детстве, когда я впервые открыл для себя магию слов и их способность переносить читателя в другие миры.',
   'За годы творчества я создал множество произведений в различных жанрах: от романтических романов до захватывающих детективов, от фантастических приключений до глубоких психологических драм. Каждая моя книга — это частичка моей души, история, которую я хочу рассказать миру.',
   'Мои произведения получили признание читателей и критиков, некоторые из них стали бестселлерами и были переведены на несколько языков. Я верю, что хорошая книга может изменить жизнь человека, и стремлюсь создавать именно такие произведения.')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO achievements (title, body, sort_order)
SELECT * FROM (
  SELECT 'Литературные награды' AS title, 'Лауреат премии "Лучший автор года"' AS body, 10 AS sort_order
  UNION ALL
  SELECT 'Образование', 'Выпускник Литературного института', 20
  UNION ALL
  SELECT 'Опыт', 'Более 15 лет в литературе', 30
) t
WHERE NOT EXISTS (SELECT 1 FROM achievements);

INSERT INTO books (title, genre, description, rating, cover_path, sort_order)
SELECT * FROM (
  SELECT 'Название книги 1', 'Роман', 'Захватывающая история о любви, предательстве и поиске себя в современном мире.', 4.9, NULL, 10
  UNION ALL
  SELECT 'Название книги 2', 'Детектив', 'Загадочное преступление, запутанные улики и неожиданная развязка.', 4.7, NULL, 20
  UNION ALL
  SELECT 'Название книги 3', 'Фантастика', 'Путешествие в альтернативную реальность, где возможно всё.', 4.8, NULL, 30
  UNION ALL
  SELECT 'Название книги 4', 'Драма', 'Эмоциональная история о человеческих отношениях и жизненных выборах.', 4.6, NULL, 40
  UNION ALL
  SELECT 'Название книги 5', 'Приключения', 'Невероятное путешествие героя через опасности и испытания.', 4.9, NULL, 50
  UNION ALL
  SELECT 'Название книги 6', 'Исторический роман', 'Погружение в прошлое, где история оживает на страницах.', 4.7, NULL, 60
) t
WHERE NOT EXISTS (SELECT 1 FROM books);

INSERT INTO reviews (reviewer_name, reviewer_location, rating, body, book_title, avatar_path, sort_order)
SELECT * FROM (
  SELECT 'Анна Петрова', 'Москва', 5,
         'Невероятно трогательная история! Читала на одном дыхании. Автору удалось создать живых, настоящих персонажей, с которыми не хочется расставаться. Рекомендую всем!',
         'Название книги 1', NULL, 10
  UNION ALL
  SELECT 'Михаил Соколов', 'Санкт-Петербург', 5,
         'Отличный детектив с неожиданной развязкой! Сюжет держит в напряжении до последней страницы. Уже прочитал все книги автора и жду новых произведений.',
         'Название книги 2', NULL, 20
  UNION ALL
  SELECT 'Елена Волкова', 'Екатеринбург', 4,
         'Фантастический мир, созданный автором, просто завораживает! Оригинальный сюжет, интересные персонажи и прекрасный язык. Обязательно прочитаю ещё!',
         'Название книги 3', NULL, 30
  UNION ALL
  SELECT 'Дмитрий Иванов', 'Новосибирск', 5,
         'Глубокая и эмоциональная драма. Книга заставила задуматься о многих вещах. Автор мастерски передаёт чувства и переживания героев. Всем рекомендую!',
         'Название книги 4', NULL, 40
  UNION ALL
  SELECT 'София Морозова', 'Казань', 5,
         'Приключенческий роман на высшем уровне! Динамичный сюжет, яркие персонажи и захватывающие события. Не могла оторваться!',
         'Название книги 5', NULL, 50
  UNION ALL
  SELECT 'Алексей Кузнецов', 'Краснодар', 4,
         'Исторический роман, который переносит в другую эпоху. Отличное знание исторических деталей и прекрасный слог. Очень понравилось!',
         'Название книги 6', NULL, 60
) t
WHERE NOT EXISTS (SELECT 1 FROM reviews);

INSERT INTO footer (id, contact_email, contact_phone, vk_label, vk_url, tg_label, tg_url, ig_label, ig_url, copyright_text)
VALUES
  (1, 'author@example.com', '+7 (XXX) XXX-XX-XX', 'VK', '#', 'TG', '#', 'IG', '#', '© 2024 [Имя Автора]. Все права защищены.')
ON DUPLICATE KEY UPDATE id=id;

