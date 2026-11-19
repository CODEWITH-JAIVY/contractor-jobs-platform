-- New empty databases only. No production data is included.
-- Generated from the application entity model and verified with MySQL 8.0.46.
-- Review against the selected RDS MySQL version before deployment.
SET FOREIGN_KEY_CHECKS=0;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_entries` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `daily_wage` int DEFAULT NULL,
  `note` varchar(200) DEFAULT NULL,
  `overtime_hours` decimal(3,1) NOT NULL,
  `overtime_rate` int DEFAULT NULL,
  `status` enum('ABSENT','HALF_DAY','PRESENT') NOT NULL,
  `work_date` date NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKk523wq91bgmu1gqn8kucmgq5i` (`user_id`,`work_date`),
  KEY `idx_att_user_date` (`user_id`,`work_date`),
  CONSTRAINT `FKp3pmju9g430ph63fb1easxocd` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contractor_profiles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `about` varchar(1000) DEFAULT NULL,
  `company_name` varchar(255) NOT NULL,
  `experience_years` int DEFAULT NULL,
  `verified` bit(1) NOT NULL,
  `work_type` varchar(255) DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKgyjcm0umel0lk96hrl9hq9qmv` (`user_id`),
  CONSTRAINT `FK7yqxtcflpc6i4khddk39eebg` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `follows` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `contractor_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKqanmg4n75u38d1562ayl52hp4` (`user_id`,`contractor_id`),
  KEY `FKbbpdq8v9jr67p4mify31nbd65` (`contractor_id`),
  CONSTRAINT `FKbbpdq8v9jr67p4mify31nbd65` FOREIGN KEY (`contractor_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKn4am7c82j2uo8pkw4x7qibf12` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_applications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `status` enum('ACCEPTED','APPLIED','REJECTED') NOT NULL,
  `job_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKs8gqynyonkhfrg6afij2tp4jt` (`job_id`,`user_id`),
  KEY `FKqs2guhg7p83917vto86imuthy` (`user_id`),
  CONSTRAINT `FKqs2guhg7p83917vto86imuthy` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKqt4m3c9yiioi16kwsyjrl0cpl` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `description` varchar(2000) DEFAULT NULL,
  `location` varchar(255) NOT NULL,
  `salary` int DEFAULT NULL,
  `status` enum('CLOSED','OPEN') NOT NULL,
  `title` varchar(255) NOT NULL,
  `workers_needed` int DEFAULT NULL,
  `contractor_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_job_contractor` (`contractor_id`),
  KEY `idx_job_status_created` (`status`,`created_at`),
  CONSTRAINT `FK7md8y1sdaowidnsp7wlwwch4w` FOREIGN KEY (`contractor_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `body` varchar(500) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `is_read` bit(1) NOT NULL,
  `title` varchar(255) NOT NULL,
  `job_id` bigint DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notif_user_created` (`user_id`,`created_at`),
  KEY `FKrtxs3hhvgew23fnco2eyy04jr` (`job_id`),
  CONSTRAINT `FK9y21adhxn0ayjhfocscqox7bh` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKrtxs3hhvgew23fnco2eyy04jr` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_entries` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `amount` int NOT NULL,
  `note` varchar(200) DEFAULT NULL,
  `pay_date` date NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pay_user_date` (`user_id`,`pay_date`),
  CONSTRAINT `FK88552wd0ukk75l36tyy4d3dks` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `city` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `daily_wage` int DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `fcm_token` varchar(255) DEFAULT NULL,
  `google_sub` varchar(255) DEFAULT NULL,
  `lang` varchar(2) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `overtime_rate` int DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `role` enum('ADMIN','CONTRACTOR','USER') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKfla1a4b51hmn2n4kuw14u210i` (`google_sub`),
  UNIQUE KEY `UKdu5v5sr43g5bfnji4vb8hg5s3` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `worker_profiles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `about` varchar(1000) DEFAULT NULL,
  `contact_phone` varchar(15) DEFAULT NULL,
  `experience_years` int DEFAULT NULL,
  `skills` varchar(200) DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKljmkjf5tk6w2jt5w4q7rnv3er` (`user_id`),
  CONSTRAINT `FKcnisf432fdaiietnktm4a06nt` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET FOREIGN_KEY_CHECKS=1;

