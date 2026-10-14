-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NULL,
    `avatar_url` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recipes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `author_id` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `servings` INTEGER NOT NULL,
    `ready_in_minutes` INTEGER NULL,
    `diets` JSON NULL,
    `dish_types` JSON NULL,
    `steps` TEXT NOT NULL,
    `image_url` VARCHAR(500) NULL,
    `video_url` VARCHAR(500) NULL,
    `nutrition` JSON NULL,
    `nutrition_coverage` ENUM('FULL', 'PARTIAL', 'NONE') NULL,
    `nutrition_updated_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recipe_ingredients` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `recipe_id` INTEGER NOT NULL,
    `ingredient_id` INTEGER NULL,
    `name_vi` VARCHAR(255) NOT NULL,
    `name_en` VARCHAR(255) NULL,
    `quantity` DECIMAL(10, 2) NULL,
    `unit` VARCHAR(50) NULL,
    `sort_order` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ingredients` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name_vi` VARCHAR(255) NOT NULL,
    `name_en` VARCHAR(255) NOT NULL,
    `common_unit` VARCHAR(20) NULL,
    `grams_per_common_unit` DECIMAL(10, 2) NULL,
    `ml_per_common_unit` DECIMAL(10, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ingredients_name_en_key`(`name_en`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ingredient_nutrition` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ingredient_id` INTEGER NOT NULL,
    `basis_quantity` DECIMAL(10, 2) NOT NULL DEFAULT 100,
    `basis_unit` VARCHAR(10) NOT NULL,
    `calories` DECIMAL(10, 2) NOT NULL,
    `protein` DECIMAL(10, 2) NOT NULL,
    `fat` DECIMAL(10, 2) NOT NULL,
    `carbohydrates` DECIMAL(10, 2) NOT NULL,
    `fiber` DECIMAL(10, 2) NULL,
    `sugar` DECIMAL(10, 2) NULL,
    `sodium` DECIMAL(10, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ingredient_nutrition_ingredient_id_key`(`ingredient_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favorites` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `recipe_id` VARCHAR(50) NOT NULL,
    `source` ENUM('LOCAL', 'SPOONACULAR') NOT NULL,
    `title_snapshot` VARCHAR(255) NOT NULL,
    `image_snapshot` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `favorites_user_id_created_at_idx`(`user_id`, `created_at`),
    UNIQUE INDEX `favorites_user_id_recipe_id_source_key`(`user_id`, `recipe_id`, `source`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shopping_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `quantity` VARCHAR(100) NULL,
    `note` TEXT NULL,
    `checked` BOOLEAN NOT NULL DEFAULT false,
    `source_recipe_id` VARCHAR(50) NULL,
    `source` ENUM('LOCAL', 'SPOONACULAR') NULL,
    `recipe_title_snapshot` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `shopping_items_user_id_checked_idx`(`user_id`, `checked`),
    INDEX `shopping_items_user_id_source_recipe_id_source_idx`(`user_id`, `source_recipe_id`, `source`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recipe_reviews` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `recipe_id` VARCHAR(50) NOT NULL,
    `source` ENUM('LOCAL', 'SPOONACULAR') NOT NULL,
    `title_snapshot` VARCHAR(255) NOT NULL,
    `image_snapshot` VARCHAR(500) NULL,
    `rating` TINYINT NOT NULL,
    `comment` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `recipe_reviews_recipe_id_source_idx`(`recipe_id`, `source`),
    UNIQUE INDEX `recipe_reviews_user_id_recipe_id_source_key`(`user_id`, `recipe_id`, `source`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `meal_plan_entries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `meal_slot` ENUM('breakfast', 'lunch', 'dinner') NOT NULL,
    `recipe_id` VARCHAR(50) NOT NULL,
    `source` ENUM('LOCAL', 'SPOONACULAR') NOT NULL,
    `title_snapshot` VARCHAR(255) NULL,
    `image_snapshot` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `meal_plan_entries_user_id_date_meal_slot_idx`(`user_id`, `date`, `meal_slot`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `recipes` ADD CONSTRAINT `recipes_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recipe_ingredients` ADD CONSTRAINT `recipe_ingredients_recipe_id_fkey` FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recipe_ingredients` ADD CONSTRAINT `recipe_ingredients_ingredient_id_fkey` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ingredient_nutrition` ADD CONSTRAINT `ingredient_nutrition_ingredient_id_fkey` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shopping_items` ADD CONSTRAINT `shopping_items_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recipe_reviews` ADD CONSTRAINT `recipe_reviews_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meal_plan_entries` ADD CONSTRAINT `meal_plan_entries_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
