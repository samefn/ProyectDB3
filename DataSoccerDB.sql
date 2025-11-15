CREATE SCHEMA IF NOT EXISTS `soccerdb`;
USE `soccerdb` ;

-- -----------------------------------------------------
-- Table `soccerdb`.`club`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `soccerdb`.`club` (
  `club_id` INT NOT NULL,
  `club_name` VARCHAR(50) NULL DEFAULT NULL,
  `country` VARCHAR(50) NULL DEFAULT NULL,
  `city` VARCHAR(50) NULL DEFAULT NULL,
  `stadium` VARCHAR(50) NULL DEFAULT NULL,
  PRIMARY KEY (`club_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `soccerdb`.`match`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `soccerdb`.`match` (
  `match_id` INT NOT NULL,
  `date` DATE NULL DEFAULT NULL,
  `result` VARCHAR(50) NULL DEFAULT NULL,
  `away_club_id` INT NOT NULL,
  `local_club_id` INT NOT NULL,
  PRIMARY KEY (`match_id`),
  INDEX `fk_match_club1_idx` (`away_club_id` ASC) VISIBLE,
  INDEX `fk_match_club2_idx` (`local_club_id` ASC) VISIBLE,
  CONSTRAINT `fk_match_club1`
    FOREIGN KEY (`away_club_id`)
    REFERENCES `soccerdb`.`club` (`club_id`),
  CONSTRAINT `fk_match_club2`
    FOREIGN KEY (`local_club_id`)
    REFERENCES `soccerdb`.`club` (`club_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `soccerdb`.`player`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `soccerdb`.`player` (
  `player_id` INT NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(50) NOT NULL,
  `last_name` VARCHAR(50) NOT NULL,
  `age` INT NULL DEFAULT NULL,
  `nationality` VARCHAR(50) NULL DEFAULT NULL,
  `club_id` INT NOT NULL,
  PRIMARY KEY (`player_id`),
  INDEX `fk_player_club_idx` (`club_id` ASC) VISIBLE,
  CONSTRAINT `fk_player_club`
    FOREIGN KEY (`club_id`)
    REFERENCES `soccerdb`.`club` (`club_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 21;


-- -----------------------------------------------------
-- Table `soccerdb`.`playermatch`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `soccerdb`.`playermatch` (
  `player_id` INT NOT NULL,
  `match_id` INT NOT NULL,
  PRIMARY KEY (`player_id`, `match_id`),
  INDEX `fk_player_has_match_match1_idx` (`match_id` ASC) VISIBLE,
  INDEX `fk_player_has_match_player1_idx` (`player_id` ASC) VISIBLE,
  CONSTRAINT `fk_player_has_match_match1`
    FOREIGN KEY (`match_id`)
    REFERENCES `soccerdb`.`match` (`match_id`),
  CONSTRAINT `fk_player_has_match_player1`
    FOREIGN KEY (`player_id`)
    REFERENCES `soccerdb`.`player` (`player_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `soccerdb`.`user`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `soccerdb`.`user` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `image` VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `name` (`name` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 11;

-- Insertar 20 Clubes
INSERT INTO club (club_id, club_name, country, city, stadium) VALUES
(1, 'Real Madrid', 'Spain', 'Madrid', 'Santiago Bernabéu'),
(2, 'FC Barcelona', 'Spain', 'Barcelona', 'Camp Nou'),
(3, 'Manchester United', 'England', 'Manchester', 'Old Trafford'),
(4, 'Liverpool', 'England', 'Liverpool', 'Anfield'),
(5, 'Bayern Munich', 'Germany', 'Munich', 'Allianz Arena'),
(6, 'Borussia Dortmund', 'Germany', 'Dortmund', 'Signal Iduna Park'),
(7, 'Paris Saint-Germain', 'France', 'Paris', 'Parc des Princes'),
(8, 'Juventus', 'Italy', 'Turin', 'Allianz Stadium'),
(9, 'Inter Milan', 'Italy', 'Milan', 'San Siro'),
(10, 'AC Milan', 'Italy', 'Milan', 'San Siro'),
(11, 'Manchester City', 'England', 'Manchester', 'Etihad Stadium'),
(12, 'Chelsea', 'England', 'London', 'Stamford Bridge'),
(13, 'Arsenal', 'England', 'London', 'Emirates Stadium'),
(14, 'Atletico Madrid', 'Spain', 'Madrid', 'Wanda Metropolitano'),
(15, 'Ajax', 'Netherlands', 'Amsterdam', 'Johan Cruyff Arena'),
(16, 'Boca Juniors', 'Argentina', 'Buenos Aires', 'La Bombonera'),
(17, 'River Plate', 'Argentina', 'Buenos Aires', 'El Monumental'),
(18, 'Flamengo', 'Brazil', 'Rio de Janeiro', 'Maracanã'),
(19, 'Palmeiras', 'Brazil', 'São Paulo', 'Allianz Parque'),
(20, 'Porto', 'Portugal', 'Porto', 'Estádio do Dragão');

-- Insertar 20 Jugadores 
INSERT INTO player (player_id, first_name, last_name, age, nationality, club_id) VALUES
(1, 'Vinicius', 'Jr.', 23, 'Brazilian', 1),
(2, 'Jude', 'Bellingham', 20, 'English', 1),
(3, 'Lamine', 'Yamal', 16, 'Spanish', 2),
(4, 'Pedri', 'González', 21, 'Spanish', 2),
(5, 'Marcus', 'Rashford', 26, 'English', 3),
(6, 'Bruno', 'Fernandes', 29, 'Portuguese', 3),
(7, 'Mohamed', 'Salah', 31, 'Egyptian', 4),
(8, 'Darwin', 'Núñez', 24, 'Uruguayan', 4),
(9, 'Harry', 'Kane', 30, 'English', 5),
(10, 'Jamal', 'Musiala', 21, 'German', 5),
(11, 'Kylian', 'Mbappé', 25, 'French', 7),
(12, 'Ousmane', 'Dembélé', 26, 'French', 7),
(13, 'Dušan', 'Vlahović', 24, 'Serbian', 8),
(14, 'Federico', 'Chiesa', 26, 'Italian', 8),
(15, 'Lautaro', 'Martínez', 26, 'Argentine', 9),
(16, 'Erling', 'Haaland', 23, 'Norwegian', 11),
(17, 'Kevin', 'De Bruyne', 32, 'Belgian', 11),
(18, 'Bukayo', 'Saka', 22, 'English', 13),
(19, 'Antoine', 'Griezmann', 32, 'French', 14),
(20, 'Edinson', 'Cavani', 37, 'Uruguayan', 16);

-- Insertar 20 Partidos
INSERT INTO `match` (match_id, `date`, result, away_club_id, local_club_id) VALUES
(1, '2024-01-01', '3-1', 2, 1),
(2, '2024-01-03', '2-2', 4, 3),
(3, '2024-01-05', '1-0', 6, 5),
(4, '2024-01-07', '0-0', 8, 7),
(5, '2024-01-09', '2-1', 10, 9),
(6, '2024-01-11', '4-2', 12, 11),
(7, '2024-01-13', '1-1', 14, 13),
(8, '2024-01-15', '3-0', 16, 15),
(9, '2024-01-17', '2-0', 18, 17),
(10, '2024-01-19', '1-2', 20, 19),
(11, '2024-01-21', '1-3', 1, 2),
(12, '2024-01-23', '0-1', 3, 4),
(13, '2024-01-25', '2-2', 5, 6),
(14, '2024-01-27', '3-1', 7, 8),
(15, '2024-01-29', '0-0', 9, 10),
(16, '2024-02-01', '1-0', 11, 12),
(17, '2024-02-03', '2-1', 13, 14),
(18, '2024-02-05', '0-2', 15, 16),
(19, '2024-02-07', '3-3', 17, 18),
(20, '2024-02-09', '1-0', 19, 20);

-- Insertar 20 Relaciones Player-Match
INSERT INTO playermatch (player_id, match_id) VALUES
(1, 1),
(2, 1),
(3, 1),
(4, 1),
(5, 2),
(6, 2),
(7, 2),
(8, 2),
(9, 3),
(10, 3),
(11, 4),
(12, 4),
(13, 5),
(14, 5),
(15, 6),
(16, 6),
(17, 7),
(18, 7),
(19, 8),
(20, 8);
