-- CreateTable
CREATE TABLE `password_reset_otps` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `otp_hash` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `consumed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `password_reset_otps_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `ingredients_name_vi_idx` ON `ingredients`(`name_vi`);

-- CreateIndex
CREATE INDEX `recipe_ingredients_name_vi_idx` ON `recipe_ingredients`(`name_vi`);

-- CreateIndex
CREATE INDEX `recipe_ingredients_name_en_idx` ON `recipe_ingredients`(`name_en`);

-- CreateIndex
CREATE INDEX `recipes_author_id_created_at_idx` ON `recipes`(`author_id`, `created_at`);

-- AddForeignKey
ALTER TABLE `password_reset_otps` ADD CONSTRAINT `password_reset_otps_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
