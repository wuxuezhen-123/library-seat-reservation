-- MySQL dump 10.13  Distrib 9.7.0, for Win64 (x86_64)
--
-- Host: localhost    Database: library_db
-- ------------------------------------------------------
-- Server version	9.7.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `library_keeper`
--

DROP TABLE IF EXISTS `library_keeper`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `library_keeper` (
  `keeper_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '工号',
  `password` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '登录密码',
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '管理员姓名',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`keeper_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `library_keeper`
--

LOCK TABLES `library_keeper` WRITE;
/*!40000 ALTER TABLE `library_keeper` DISABLE KEYS */;
INSERT INTO `library_keeper` VALUES ('admin001','admin123','管理员1','2026-05-25 14:42:21'),('admin002','admin123','管理员2','2026-05-25 14:42:26');
/*!40000 ALTER TABLE `library_keeper` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservation`
--

DROP TABLE IF EXISTS `reservation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservation` (
  `res_id` int NOT NULL AUTO_INCREMENT COMMENT '预约记录ID',
  `stu_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '学生学号',
  `seat_id` int NOT NULL COMMENT '座位ID',
  `slot_id` int NOT NULL COMMENT '时段ID',
  `res_date` date NOT NULL COMMENT '预约日期',
  `res_status` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0-已预约，1-已签到，2-已签退，3-已取消，4-违约终止',
  `checkin_time` datetime DEFAULT NULL COMMENT '实际签到时间',
  `checkout_time` datetime DEFAULT NULL COMMENT '实际签退时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '预约创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  PRIMARY KEY (`res_id`),
  UNIQUE KEY `uk_seat_slot_date` (`res_date`,`slot_id`,`seat_id`) COMMENT '同一座位同一时段不可重复预约',
  UNIQUE KEY `uk_stu_slot_date` (`res_date`,`slot_id`,`stu_id`) COMMENT '同一用户同一时段不可预约多个座位',
  KEY `stu_id` (`stu_id`),
  KEY `seat_id` (`seat_id`),
  KEY `slot_id` (`slot_id`),
  CONSTRAINT `reservation_ibfk_1` FOREIGN KEY (`stu_id`) REFERENCES `student` (`stu_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `reservation_ibfk_2` FOREIGN KEY (`seat_id`) REFERENCES `seat` (`seat_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `reservation_ibfk_3` FOREIGN KEY (`slot_id`) REFERENCES `time_slot` (`slot_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预约记录表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservation`
--

LOCK TABLES `reservation` WRITE;
/*!40000 ALTER TABLE `reservation` DISABLE KEYS */;
INSERT INTO `reservation` VALUES (1,'001',1,1,'2026-05-26',2,'2026-05-26 08:05:00','2026-05-26 11:50:00','2026-05-25 14:46:56','2026-05-25 14:46:56'),(2,'002',21,2,'2026-05-26',0,NULL,NULL,'2026-05-25 14:47:00','2026-05-25 14:47:00'),(3,'004',41,3,'2026-05-27',1,'2026-05-27 16:10:00',NULL,'2026-05-25 14:47:04','2026-05-25 14:47:04'),(4,'005',5,1,'2026-05-28',3,NULL,NULL,'2026-05-25 14:47:08','2026-05-25 14:47:08'),(5,'001',25,2,'2026-05-29',4,NULL,NULL,'2026-05-25 14:47:13','2026-05-25 14:47:13'),(6,'002',22,1,'2026-05-24',4,NULL,NULL,'2026-05-25 14:51:24','2026-05-25 14:51:24');
/*!40000 ALTER TABLE `reservation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seat`
--

DROP TABLE IF EXISTS `seat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seat` (
  `seat_id` int NOT NULL AUTO_INCREMENT COMMENT '座位ID',
  `area_id` int NOT NULL COMMENT '所属区域ID',
  `seat_code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '座位编号（同一区域内唯一，如1,2,...,20）',
  `seat_status` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0-空闲，1-已预约，2-已占用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`seat_id`),
  UNIQUE KEY `uk_area_seat` (`area_id`,`seat_code`),
  CONSTRAINT `seat_ibfk_1` FOREIGN KEY (`area_id`) REFERENCES `study_area` (`area_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='座位表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seat`
--

LOCK TABLES `seat` WRITE;
/*!40000 ALTER TABLE `seat` DISABLE KEYS */;
INSERT INTO `seat` VALUES (1,1,'1',0,'2026-05-25 14:35:53'),(2,1,'2',0,'2026-05-25 14:35:53'),(3,1,'3',0,'2026-05-25 14:35:53'),(4,1,'4',0,'2026-05-25 14:35:53'),(5,1,'5',0,'2026-05-25 14:35:53'),(6,1,'6',0,'2026-05-25 14:35:53'),(7,1,'7',0,'2026-05-25 14:35:53'),(8,1,'8',0,'2026-05-25 14:35:53'),(9,1,'9',0,'2026-05-25 14:35:53'),(10,1,'10',0,'2026-05-25 14:35:53'),(11,1,'11',0,'2026-05-25 14:35:53'),(12,1,'12',0,'2026-05-25 14:35:53'),(13,1,'13',0,'2026-05-25 14:35:53'),(14,1,'14',0,'2026-05-25 14:35:53'),(15,1,'15',0,'2026-05-25 14:35:53'),(16,1,'16',0,'2026-05-25 14:35:53'),(17,1,'17',0,'2026-05-25 14:35:53'),(18,1,'18',0,'2026-05-25 14:35:53'),(19,1,'19',0,'2026-05-25 14:35:53'),(20,1,'20',0,'2026-05-25 14:35:53'),(21,2,'1',1,'2026-05-25 14:35:53'),(22,2,'2',0,'2026-05-25 14:35:53'),(23,2,'3',0,'2026-05-25 14:35:53'),(24,2,'4',0,'2026-05-25 14:35:53'),(25,2,'5',0,'2026-05-25 14:35:53'),(26,2,'6',0,'2026-05-25 14:35:53'),(27,2,'7',0,'2026-05-25 14:35:53'),(28,2,'8',0,'2026-05-25 14:35:53'),(29,2,'9',0,'2026-05-25 14:35:53'),(30,2,'10',0,'2026-05-25 14:35:53'),(31,2,'11',0,'2026-05-25 14:35:53'),(32,2,'12',0,'2026-05-25 14:35:53'),(33,2,'13',0,'2026-05-25 14:35:53'),(34,2,'14',0,'2026-05-25 14:35:53'),(35,2,'15',0,'2026-05-25 14:35:53'),(36,2,'16',0,'2026-05-25 14:35:53'),(37,2,'17',0,'2026-05-25 14:35:53'),(38,2,'18',0,'2026-05-25 14:35:53'),(39,2,'19',0,'2026-05-25 14:35:53'),(40,2,'20',0,'2026-05-25 14:35:53'),(41,3,'1',2,'2026-05-25 14:35:53'),(42,3,'2',0,'2026-05-25 14:35:53'),(43,3,'3',0,'2026-05-25 14:35:53'),(44,3,'4',0,'2026-05-25 14:35:53'),(45,3,'5',0,'2026-05-25 14:35:53'),(46,3,'6',0,'2026-05-25 14:35:53'),(47,3,'7',0,'2026-05-25 14:35:53'),(48,3,'8',0,'2026-05-25 14:35:53'),(49,3,'9',0,'2026-05-25 14:35:53'),(50,3,'10',0,'2026-05-25 14:35:53'),(51,3,'11',0,'2026-05-25 14:35:53'),(52,3,'12',0,'2026-05-25 14:35:53'),(53,3,'13',0,'2026-05-25 14:35:53'),(54,3,'14',0,'2026-05-25 14:35:53'),(55,3,'15',0,'2026-05-25 14:35:53'),(56,3,'16',0,'2026-05-25 14:35:53'),(57,3,'17',0,'2026-05-25 14:35:53'),(58,3,'18',0,'2026-05-25 14:35:53'),(59,3,'19',0,'2026-05-25 14:35:53'),(60,3,'20',0,'2026-05-25 14:35:53');
/*!40000 ALTER TABLE `seat` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student`
--

DROP TABLE IF EXISTS `student`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student` (
  `stu_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '学号',
  `password` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '登录密码（哈希存储）',
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '学生姓名',
  `violation_count` int NOT NULL DEFAULT '0' COMMENT '当前连续有效违约次数',
  `is_blacklisted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否在黑名单中（0-否，1-是）',
  `ban_expire_time` datetime DEFAULT NULL COMMENT '黑名单解封时间（NULL表示不在封禁期）',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
  PRIMARY KEY (`stu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student`
--

LOCK TABLES `student` WRITE;
/*!40000 ALTER TABLE `student` DISABLE KEYS */;
INSERT INTO `student` VALUES ('001','123456','张三',0,0,NULL,'2026-05-25 14:45:38','2026-05-25 14:45:38'),('002','123456','李四',1,0,NULL,'2026-05-25 14:45:38','2026-05-25 14:45:38'),('003','123456','王五',2,1,'2026-06-01 14:45:38','2026-05-25 14:45:38','2026-05-25 14:45:38'),('004','123456','赵六',0,0,NULL,'2026-05-25 14:45:38','2026-05-25 14:45:38'),('005','123456','周七',0,0,NULL,'2026-05-25 14:45:38','2026-05-25 14:45:38');
/*!40000 ALTER TABLE `student` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `study_area`
--

DROP TABLE IF EXISTS `study_area`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `study_area` (
  `area_id` int NOT NULL AUTO_INCREMENT COMMENT '区域ID',
  `area_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '区域名称（A区/B区/C区）',
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '启用状态（0-停用，1-启用）',
  PRIMARY KEY (`area_id`),
  UNIQUE KEY `area_name` (`area_name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='自习区域表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `study_area`
--

LOCK TABLES `study_area` WRITE;
/*!40000 ALTER TABLE `study_area` DISABLE KEYS */;
INSERT INTO `study_area` VALUES (1,'A区',1),(2,'B区',1),(3,'C区',1);
/*!40000 ALTER TABLE `study_area` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `time_slot`
--

DROP TABLE IF EXISTS `time_slot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `time_slot` (
  `slot_id` int NOT NULL AUTO_INCREMENT COMMENT '时段ID',
  `slot_name` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '上午场/下午场/晚间场',
  `start_time` time NOT NULL COMMENT '开始时间（如 08:00:00）',
  `end_time` time NOT NULL COMMENT '结束时间（如 12:00:00）',
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '启用状态（0-停用，1-启用）',
  PRIMARY KEY (`slot_id`),
  UNIQUE KEY `slot_name` (`slot_name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预约时段表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `time_slot`
--

LOCK TABLES `time_slot` WRITE;
/*!40000 ALTER TABLE `time_slot` DISABLE KEYS */;
INSERT INTO `time_slot` VALUES (1,'上午场','08:00:00','12:00:00',1),(2,'下午场','12:00:00','16:00:00',1),(3,'晚间场','16:00:00','20:00:00',1);
/*!40000 ALTER TABLE `time_slot` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `violate_record`
--

DROP TABLE IF EXISTS `violate_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `violate_record` (
  `violate_id` int NOT NULL AUTO_INCREMENT COMMENT '违约记录ID',
  `stu_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '学生学号',
  `res_id` int NOT NULL COMMENT '关联的预约记录ID',
  `violate_reason` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '违约原因',
  `violate_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '违约发生时间',
  `is_effective` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否计入连续违约计数（1-是，0-否）',
  PRIMARY KEY (`violate_id`),
  UNIQUE KEY `uk_res` (`res_id`) COMMENT '一条预约最多一条违约记录',
  KEY `stu_id` (`stu_id`),
  CONSTRAINT `violate_record_ibfk_1` FOREIGN KEY (`stu_id`) REFERENCES `student` (`stu_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `violate_record_ibfk_2` FOREIGN KEY (`res_id`) REFERENCES `reservation` (`res_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='违约记录表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `violate_record`
--

LOCK TABLES `violate_record` WRITE;
/*!40000 ALTER TABLE `violate_record` DISABLE KEYS */;
INSERT INTO `violate_record` VALUES (1,'001',5,'超时未签到','2026-05-25 14:51:20',1),(2,'002',6,'超时未签退','2026-05-25 14:51:28',1),(3,'002',2,'超时未签退','2026-05-25 14:52:12',1);
/*!40000 ALTER TABLE `violate_record` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-28 20:34:30
