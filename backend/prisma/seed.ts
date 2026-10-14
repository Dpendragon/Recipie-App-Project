import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import {
  PrismaClient,
  RecipeSource,
  MealSlot,
  NutritionCoverage,
} from "../src/generated/prisma/client";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : 3306,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

async function resetTables() {
  await prisma.mealPlanEntry.deleteMany();
  await prisma.recipeReview.deleteMany();
  await prisma.shoppingItem.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.recipeIngredient.deleteMany();
  await prisma.ingredientNutrition.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.user.deleteMany();
}


// ============================================================================
// 1. users
// ============================================================================
const DEMO_PASSWORD = "password";

async function seedUsers() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await prisma.user.createMany({
    data: [
      { id: 1, email: 'nguyenvana@gmail.com', passwordHash, name: 'Nguyễn Văn A', avatarUrl: null, createdAt: new Date('2025-01-10T08:00:00Z'), updatedAt: new Date('2025-01-10T08:00:00Z'), deletedAt: null },
      { id: 2, email: 'tranthib@gmail.com', passwordHash, name: 'Trần Thị B', avatarUrl: null, createdAt: new Date('2025-01-15T09:30:00Z'), updatedAt: new Date('2025-02-01T10:00:00Z'), deletedAt: null },
      { id: 3, email: 'lehoangc@gmail.com', passwordHash, name: 'Lê Hoàng C', avatarUrl: null, createdAt: new Date('2025-02-02T14:20:00Z'), updatedAt: new Date('2025-02-02T14:20:00Z'), deletedAt: null },
      { id: 4, email: 'phamthid@gmail.com', passwordHash, name: 'Phạm Thị D', avatarUrl: null, createdAt: new Date('2025-02-20T11:05:00Z'), updatedAt: new Date('2025-03-05T16:45:00Z'), deletedAt: null },
      { id: 5, email: 'vominhe@gmail.com', passwordHash, name: 'Võ Minh E', avatarUrl: null, createdAt: new Date('2025-03-01T07:40:00Z'), updatedAt: new Date('2025-03-01T07:40:00Z'), deletedAt: null },
      { id: 6, email: 'buivang@gmail.com', passwordHash, name: 'Bùi Văn G', avatarUrl: null, createdAt: new Date('2025-03-18T19:10:00Z'), updatedAt: new Date('2025-04-02T09:00:00Z'), deletedAt: null },
      { id: 7, email: 'dangthif@gmail.com', passwordHash, name: 'Đặng Thị F', avatarUrl: null, createdAt: new Date('2025-04-05T13:00:00Z'), updatedAt: new Date('2025-06-01T10:00:00Z'), deletedAt: new Date('2025-06-01T10:00:00Z') },
      { id: 8, email: 'hothih@gmail.com', passwordHash, name: null, avatarUrl: null, createdAt: new Date('2025-04-22T08:50:00Z'), updatedAt: new Date('2025-04-22T08:50:00Z'), deletedAt: null }
    ],
  });
}

// ============================================================================
// 2. ingredients
// ============================================================================

async function seedIngredients() {
  const now = new Date('2025-01-05T08:00:00Z');
  await prisma.ingredient.createMany({
    data: [
      { id: 1, nameVi: 'Gạo tẻ', nameEn: 'White rice', commonUnit: null, gramsPerCommonUnit: null, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 2, nameVi: 'Bột mì đa dụng', nameEn: 'All-purpose flour', commonUnit: null, gramsPerCommonUnit: null, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 3, nameVi: 'Đường trắng', nameEn: 'White sugar', commonUnit: null, gramsPerCommonUnit: null, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 4, nameVi: 'Muối ăn', nameEn: 'Salt', commonUnit: null, gramsPerCommonUnit: null, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 5, nameVi: 'Thịt heo xay', nameEn: 'Ground pork', commonUnit: null, gramsPerCommonUnit: null, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 6, nameVi: 'Thịt bò thăn', nameEn: 'Beef tenderloin', commonUnit: null, gramsPerCommonUnit: null, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 7, nameVi: 'Ức gà', nameEn: 'Chicken breast', commonUnit: null, gramsPerCommonUnit: null, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 8, nameVi: 'Tôm sú', nameEn: 'Tiger shrimp', commonUnit: null, gramsPerCommonUnit: null, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 9, nameVi: 'Cá lóc', nameEn: 'Snakehead fish', commonUnit: null, gramsPerCommonUnit: null, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 10, nameVi: 'Bún tươi', nameEn: 'Fresh rice vermicelli', commonUnit: null, gramsPerCommonUnit: null, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 11, nameVi: 'Bánh phở', nameEn: 'Pho rice noodles', commonUnit: null, gramsPerCommonUnit: null, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 12, nameVi: 'Bắp cải', nameEn: 'Cabbage', commonUnit: null, gramsPerCommonUnit: null, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 13, nameVi: 'Bí đỏ', nameEn: 'Pumpkin', commonUnit: null, gramsPerCommonUnit: null, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 14, nameVi: 'Bột năng', nameEn: 'Tapioca starch', commonUnit: null, gramsPerCommonUnit: null, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 15, nameVi: 'Đường phèn', nameEn: 'Rock sugar', commonUnit: null, gramsPerCommonUnit: null, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 16, nameVi: 'Dưa hấu', nameEn: 'Watermelon', commonUnit: null, gramsPerCommonUnit: null, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 17, nameVi: 'Đậu phộng rang', nameEn: 'Roasted peanuts', commonUnit: null, gramsPerCommonUnit: null, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 18, nameVi: 'Nấm rơm', nameEn: 'Straw mushroom', commonUnit: null, gramsPerCommonUnit: null, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 19, nameVi: 'Giá đỗ', nameEn: 'Bean sprouts', commonUnit: null, gramsPerCommonUnit: null, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 20, nameVi: 'Bột chiên giòn', nameEn: 'Crispy frying flour', commonUnit: null, gramsPerCommonUnit: null, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 21, nameVi: 'Trứng gà', nameEn: 'Chicken egg', commonUnit: 'quả', gramsPerCommonUnit: 50, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 22, nameVi: 'Chanh', nameEn: 'Lime', commonUnit: 'quả', gramsPerCommonUnit: 60, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 23, nameVi: 'Cà chua', nameEn: 'Tomato', commonUnit: 'quả', gramsPerCommonUnit: 120, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 24, nameVi: 'Hành tây', nameEn: 'Onion', commonUnit: 'củ', gramsPerCommonUnit: 150, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 25, nameVi: 'Tỏi', nameEn: 'Garlic', commonUnit: 'tép', gramsPerCommonUnit: 5, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 26, nameVi: 'Gừng', nameEn: 'Ginger', commonUnit: 'củ', gramsPerCommonUnit: 30, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 27, nameVi: 'Ớt sừng', nameEn: 'Chili pepper', commonUnit: 'trái', gramsPerCommonUnit: 10, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 28, nameVi: 'Hành lá', nameEn: 'Scallion', commonUnit: 'cây', gramsPerCommonUnit: 15, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 29, nameVi: 'Chuối', nameEn: 'Banana', commonUnit: 'quả', gramsPerCommonUnit: 120, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 30, nameVi: 'Khoai tây', nameEn: 'Potato', commonUnit: 'củ', gramsPerCommonUnit: 150, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 31, nameVi: 'Cà rốt', nameEn: 'Carrot', commonUnit: 'củ', gramsPerCommonUnit: 100, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 32, nameVi: 'Chanh dây', nameEn: 'Passion fruit', commonUnit: 'quả', gramsPerCommonUnit: 40, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 33, nameVi: 'Sả', nameEn: 'Lemongrass', commonUnit: 'cây', gramsPerCommonUnit: 20, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 34, nameVi: 'Lá chanh', nameEn: 'Lime leaves', commonUnit: 'lá', gramsPerCommonUnit: 0.5, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 35, nameVi: 'Rau mùi', nameEn: 'Cilantro', commonUnit: 'bó', gramsPerCommonUnit: 20, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 36, nameVi: 'Dưa leo', nameEn: 'Cucumber', commonUnit: 'quả', gramsPerCommonUnit: 100, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 37, nameVi: 'Xoài', nameEn: 'Mango', commonUnit: 'quả', gramsPerCommonUnit: 200, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 38, nameVi: 'Táo', nameEn: 'Apple', commonUnit: 'quả', gramsPerCommonUnit: 150, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 39, nameVi: 'Rau muống', nameEn: 'Water spinach', commonUnit: 'bó', gramsPerCommonUnit: 300, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 40, nameVi: 'Dầu ăn', nameEn: 'Cooking oil', commonUnit: 'muỗng canh', gramsPerCommonUnit: null, mlPerCommonUnit: 15, createdAt: now, updatedAt: now },
      { id: 41, nameVi: 'Nước mắm', nameEn: 'Fish sauce', commonUnit: 'muỗng canh', gramsPerCommonUnit: null, mlPerCommonUnit: 15, createdAt: now, updatedAt: now },
      { id: 42, nameVi: 'Nước tương', nameEn: 'Soy sauce', commonUnit: 'muỗng canh', gramsPerCommonUnit: null, mlPerCommonUnit: 15, createdAt: now, updatedAt: now },
      { id: 43, nameVi: 'Dầu hào', nameEn: 'Oyster sauce', commonUnit: 'muỗng canh', gramsPerCommonUnit: null, mlPerCommonUnit: 15, createdAt: now, updatedAt: now },
      { id: 44, nameVi: 'Giấm', nameEn: 'Vinegar', commonUnit: 'muỗng canh', gramsPerCommonUnit: null, mlPerCommonUnit: 15, createdAt: now, updatedAt: now },
      { id: 45, nameVi: 'Sữa tươi không đường', nameEn: 'Unsweetened fresh milk', commonUnit: 'ly', gramsPerCommonUnit: null, mlPerCommonUnit: 200, createdAt: now, updatedAt: now },
      { id: 46, nameVi: 'Sữa đặc', nameEn: 'Condensed milk', commonUnit: 'muỗng canh', gramsPerCommonUnit: null, mlPerCommonUnit: 15, createdAt: now, updatedAt: now },
      { id: 47, nameVi: 'Nước cốt dừa', nameEn: 'Coconut milk', commonUnit: 'lon', gramsPerCommonUnit: null, mlPerCommonUnit: 400, createdAt: now, updatedAt: now },
      { id: 48, nameVi: 'Rượu trắng nấu ăn', nameEn: 'Cooking rice wine', commonUnit: 'muỗng canh', gramsPerCommonUnit: null, mlPerCommonUnit: 15, createdAt: now, updatedAt: now },
      { id: 49, nameVi: 'Phô mai lát', nameEn: 'Cheese slice', commonUnit: 'lát', gramsPerCommonUnit: 20, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 50, nameVi: 'Đậu hũ', nameEn: 'Tofu', commonUnit: 'miếng', gramsPerCommonUnit: 150, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 51, nameVi: 'Xúc xích', nameEn: 'Sausage', commonUnit: 'cây', gramsPerCommonUnit: 45, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 52, nameVi: 'Thịt xông khói', nameEn: 'Bacon', commonUnit: 'lát', gramsPerCommonUnit: 15, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 53, nameVi: 'Sữa chua không đường', nameEn: 'Plain yogurt', commonUnit: 'hộp', gramsPerCommonUnit: 100, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 54, nameVi: 'Mì gói', nameEn: 'Instant noodles', commonUnit: 'gói', gramsPerCommonUnit: 75, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 55, nameVi: 'Bánh tráng', nameEn: 'Rice paper', commonUnit: 'cái', gramsPerCommonUnit: 10, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 56, nameVi: 'Bột nghệ', nameEn: 'Turmeric powder', commonUnit: 'muỗng cà phê', gramsPerCommonUnit: 3, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 57, nameVi: 'Tiêu xay', nameEn: 'Ground pepper', commonUnit: 'muỗng cà phê', gramsPerCommonUnit: 2, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 58, nameVi: 'Bột ngọt', nameEn: 'MSG (monosodium glutamate)', commonUnit: 'muỗng cà phê', gramsPerCommonUnit: 4, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 59, nameVi: 'Men nở', nameEn: 'Yeast', commonUnit: 'muỗng cà phê', gramsPerCommonUnit: 3, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 60, nameVi: 'Bột cà ri', nameEn: 'Curry powder', commonUnit: 'muỗng canh', gramsPerCommonUnit: 6, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 61, nameVi: 'Thịt ba chỉ', nameEn: 'Pork belly', commonUnit: null, gramsPerCommonUnit: null, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 62, nameVi: 'Sườn heo', nameEn: 'Pork ribs', commonUnit: null, gramsPerCommonUnit: null, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 63, nameVi: 'Trứng cút', nameEn: 'Quail egg', commonUnit: 'quả', gramsPerCommonUnit: 9, mlPerCommonUnit: null, createdAt: now, updatedAt: now },
      { id: 64, nameVi: 'Xà lách', nameEn: 'Lettuce', commonUnit: null, gramsPerCommonUnit: null, mlPerCommonUnit: null, createdAt: now, updatedAt: now }
    ],
  });
}

// ============================================================================
// 3. ingredient_nutrition
// ============================================================================

async function seedIngredientNutrition() {
  const now = new Date('2025-01-05T08:00:00Z');
  await prisma.ingredientNutrition.createMany({
    data: [
      { id: 1, ingredientId: 1, basisQuantity: 100, basisUnit: 'g', calories: 365, protein: 7.1, fat: 0.7, carbohydrates: 80.0, fiber: 1.3, sugar: 0.1, sodium: 5, createdAt: now, updatedAt: now },
      { id: 2, ingredientId: 2, basisQuantity: 100, basisUnit: 'g', calories: 364, protein: 10.3, fat: 1.0, carbohydrates: 76.3, fiber: 2.7, sugar: 0.3, sodium: 2, createdAt: now, updatedAt: now },
      { id: 3, ingredientId: 3, basisQuantity: 100, basisUnit: 'g', calories: 387, protein: 0.0, fat: 0.0, carbohydrates: 100.0, fiber: 0.0, sugar: 100.0, sodium: 1, createdAt: now, updatedAt: now },
      { id: 4, ingredientId: 4, basisQuantity: 100, basisUnit: 'g', calories: 0, protein: 0.0, fat: 0.0, carbohydrates: 0.0, fiber: 0.0, sugar: 0.0, sodium: 38700, createdAt: now, updatedAt: now },
      { id: 5, ingredientId: 5, basisQuantity: 100, basisUnit: 'g', calories: 263, protein: 17.2, fat: 21.2, carbohydrates: 0.0, fiber: 0.0, sugar: 0.0, sodium: 62, createdAt: now, updatedAt: now },
      { id: 6, ingredientId: 6, basisQuantity: 100, basisUnit: 'g', calories: 187, protein: 20.8, fat: 11.2, carbohydrates: 0.0, fiber: 0.0, sugar: 0.0, sodium: 58, createdAt: now, updatedAt: now },
      { id: 7, ingredientId: 7, basisQuantity: 100, basisUnit: 'g', calories: 165, protein: 31.0, fat: 3.6, carbohydrates: 0.0, fiber: 0.0, sugar: 0.0, sodium: 74, createdAt: now, updatedAt: now },
      { id: 8, ingredientId: 8, basisQuantity: 100, basisUnit: 'g', calories: 99, protein: 24.0, fat: 0.3, carbohydrates: 0.2, fiber: 0.0, sugar: 0.0, sodium: 111, createdAt: now, updatedAt: now },
      { id: 9, ingredientId: 9, basisQuantity: 100, basisUnit: 'g', calories: 92, protein: 18.2, fat: 1.5, carbohydrates: 0.0, fiber: 0.0, sugar: 0.0, sodium: 60, createdAt: now, updatedAt: now },
      { id: 10, ingredientId: 10, basisQuantity: 100, basisUnit: 'g', calories: 109, protein: 1.8, fat: 0.2, carbohydrates: 25.0, fiber: 1.0, sugar: 0.0, sodium: 3, createdAt: now, updatedAt: now },
      { id: 11, ingredientId: 11, basisQuantity: 100, basisUnit: 'g', calories: 109, protein: 1.8, fat: 0.2, carbohydrates: 24.0, fiber: 0.9, sugar: 0.0, sodium: 3, createdAt: now, updatedAt: now },
      { id: 12, ingredientId: 12, basisQuantity: 100, basisUnit: 'g', calories: 25, protein: 1.3, fat: 0.1, carbohydrates: 5.8, fiber: 2.5, sugar: 3.2, sodium: 18, createdAt: now, updatedAt: now },
      { id: 13, ingredientId: 13, basisQuantity: 100, basisUnit: 'g', calories: 26, protein: 1.0, fat: 0.1, carbohydrates: 6.5, fiber: 0.5, sugar: 2.8, sodium: 1, createdAt: now, updatedAt: now },
      { id: 14, ingredientId: 16, basisQuantity: 100, basisUnit: 'g', calories: 30, protein: 0.6, fat: 0.2, carbohydrates: 7.6, fiber: 0.4, sugar: 6.2, sodium: 1, createdAt: now, updatedAt: now },
      { id: 15, ingredientId: 17, basisQuantity: 100, basisUnit: 'g', calories: 567, protein: 25.8, fat: 49.2, carbohydrates: 16.1, fiber: 8.5, sugar: 4.2, sodium: 18, createdAt: now, updatedAt: now },
      { id: 16, ingredientId: 18, basisQuantity: 100, basisUnit: 'g', calories: 26, protein: 2.7, fat: 0.2, carbohydrates: 4.3, fiber: 2.3, sugar: 2.0, sodium: 6, createdAt: now, updatedAt: now },
      { id: 17, ingredientId: 19, basisQuantity: 100, basisUnit: 'g', calories: 30, protein: 3.0, fat: 0.2, carbohydrates: 5.9, fiber: 1.8, sugar: 4.1, sodium: 6, createdAt: now, updatedAt: now },
      { id: 18, ingredientId: 21, basisQuantity: 100, basisUnit: 'g', calories: 155, protein: 13.0, fat: 11.0, carbohydrates: 1.1, fiber: 0.0, sugar: 1.1, sodium: 124, createdAt: now, updatedAt: now },
      { id: 19, ingredientId: 22, basisQuantity: 100, basisUnit: 'g', calories: 30, protein: 0.7, fat: 0.2, carbohydrates: 10.5, fiber: 2.8, sugar: 1.7, sodium: 2, createdAt: now, updatedAt: now },
      { id: 20, ingredientId: 23, basisQuantity: 100, basisUnit: 'g', calories: 18, protein: 0.9, fat: 0.2, carbohydrates: 3.9, fiber: 1.2, sugar: 2.6, sodium: 5, createdAt: now, updatedAt: now },
      { id: 21, ingredientId: 24, basisQuantity: 100, basisUnit: 'g', calories: 40, protein: 1.1, fat: 0.1, carbohydrates: 9.3, fiber: 1.7, sugar: 4.2, sodium: 4, createdAt: now, updatedAt: now },
      { id: 22, ingredientId: 25, basisQuantity: 100, basisUnit: 'g', calories: 149, protein: 6.4, fat: 0.5, carbohydrates: 33.1, fiber: 2.1, sugar: 1.0, sodium: 17, createdAt: now, updatedAt: now },
      { id: 23, ingredientId: 26, basisQuantity: 100, basisUnit: 'g', calories: 80, protein: 1.8, fat: 0.8, carbohydrates: 17.8, fiber: 2.0, sugar: 1.7, sodium: 13, createdAt: now, updatedAt: now },
      { id: 24, ingredientId: 27, basisQuantity: 100, basisUnit: 'g', calories: 40, protein: 1.9, fat: 0.4, carbohydrates: 8.8, fiber: 1.5, sugar: 5.3, sodium: 9, createdAt: now, updatedAt: now },
      { id: 25, ingredientId: 28, basisQuantity: 100, basisUnit: 'g', calories: 32, protein: 1.8, fat: 0.2, carbohydrates: 7.3, fiber: 2.6, sugar: 2.3, sodium: 16, createdAt: now, updatedAt: now },
      { id: 26, ingredientId: 29, basisQuantity: 100, basisUnit: 'g', calories: 89, protein: 1.1, fat: 0.3, carbohydrates: 22.8, fiber: 2.6, sugar: 12.2, sodium: 1, createdAt: now, updatedAt: now },
      { id: 27, ingredientId: 30, basisQuantity: 100, basisUnit: 'g', calories: 77, protein: 2.0, fat: 0.1, carbohydrates: 17.5, fiber: 2.2, sugar: 0.8, sodium: 6, createdAt: now, updatedAt: now },
      { id: 28, ingredientId: 31, basisQuantity: 100, basisUnit: 'g', calories: 41, protein: 0.9, fat: 0.2, carbohydrates: 9.6, fiber: 2.8, sugar: 4.7, sodium: 69, createdAt: now, updatedAt: now },
      { id: 29, ingredientId: 32, basisQuantity: 100, basisUnit: 'g', calories: 97, protein: 2.2, fat: 0.7, carbohydrates: 23.4, fiber: 10.4, sugar: 11.2, sodium: 28, createdAt: now, updatedAt: now },
      { id: 30, ingredientId: 35, basisQuantity: 100, basisUnit: 'g', calories: 23, protein: 2.1, fat: 0.5, carbohydrates: 3.7, fiber: 2.8, sugar: 0.9, sodium: 46, createdAt: now, updatedAt: now },
      { id: 31, ingredientId: 36, basisQuantity: 100, basisUnit: 'g', calories: 15, protein: 0.7, fat: 0.1, carbohydrates: 3.6, fiber: 0.5, sugar: 1.7, sodium: 2, createdAt: now, updatedAt: now },
      { id: 32, ingredientId: 37, basisQuantity: 100, basisUnit: 'g', calories: 60, protein: 0.8, fat: 0.4, carbohydrates: 15.0, fiber: 1.6, sugar: 13.7, sodium: 1, createdAt: now, updatedAt: now },
      { id: 33, ingredientId: 38, basisQuantity: 100, basisUnit: 'g', calories: 52, protein: 0.3, fat: 0.2, carbohydrates: 13.8, fiber: 2.4, sugar: 10.4, sodium: 1, createdAt: now, updatedAt: now },
      { id: 34, ingredientId: 39, basisQuantity: 100, basisUnit: 'g', calories: 19, protein: 2.6, fat: 0.2, carbohydrates: 3.1, fiber: 2.1, sugar: 0.4, sodium: 113, createdAt: now, updatedAt: now },
      { id: 35, ingredientId: 40, basisQuantity: 100, basisUnit: 'ml', calories: 884, protein: 0.0, fat: 100.0, carbohydrates: 0.0, fiber: 0.0, sugar: 0.0, sodium: 0, createdAt: now, updatedAt: now },
      { id: 36, ingredientId: 41, basisQuantity: 100, basisUnit: 'ml', calories: 35, protein: 5.1, fat: 0.0, carbohydrates: 3.6, fiber: 0.0, sugar: 0.0, sodium: 7850, createdAt: now, updatedAt: now },
      { id: 37, ingredientId: 42, basisQuantity: 100, basisUnit: 'ml', calories: 53, protein: 8.0, fat: 0.1, carbohydrates: 4.9, fiber: 0.8, sugar: 0.4, sodium: 5493, createdAt: now, updatedAt: now },
      { id: 38, ingredientId: 43, basisQuantity: 100, basisUnit: 'ml', calories: 51, protein: 1.4, fat: 0.3, carbohydrates: 11.0, fiber: 0.3, sugar: 6.4, sodium: 2700, createdAt: now, updatedAt: now },
      { id: 39, ingredientId: 44, basisQuantity: 100, basisUnit: 'ml', calories: 18, protein: 0.0, fat: 0.0, carbohydrates: 0.4, fiber: 0.0, sugar: 0.4, sodium: 2, createdAt: now, updatedAt: now },
      { id: 40, ingredientId: 45, basisQuantity: 100, basisUnit: 'ml', calories: 42, protein: 3.4, fat: 1.0, carbohydrates: 5.0, fiber: 0.0, sugar: 5.0, sodium: 44, createdAt: now, updatedAt: now },
      { id: 41, ingredientId: 46, basisQuantity: 100, basisUnit: 'ml', calories: 415, protein: 10.22, fat: 11.24, carbohydrates: 70.27, fiber: 0.0, sugar: 70.27, sodium: 164, createdAt: now, updatedAt: now },
      { id: 42, ingredientId: 47, basisQuantity: 100, basisUnit: 'ml', calories: 230, protein: 2.3, fat: 24.0, carbohydrates: 5.5, fiber: 2.2, sugar: 3.3, sodium: 15, createdAt: now, updatedAt: now },
      { id: 43, ingredientId: 49, basisQuantity: 100, basisUnit: 'g', calories: 330, protein: 18.0, fat: 27.0, carbohydrates: 3.0, fiber: 0.0, sugar: 1.0, sodium: 1100, createdAt: now, updatedAt: now },
      { id: 44, ingredientId: 50, basisQuantity: 100, basisUnit: 'g', calories: 76, protein: 8.0, fat: 4.8, carbohydrates: 1.9, fiber: 0.3, sugar: 0.6, sodium: 7, createdAt: now, updatedAt: now },
      { id: 45, ingredientId: 51, basisQuantity: 100, basisUnit: 'g', calories: 301, protein: 12.0, fat: 27.0, carbohydrates: 3.0, fiber: 0.0, sugar: 1.0, sodium: 900, createdAt: now, updatedAt: now },
      { id: 46, ingredientId: 52, basisQuantity: 100, basisUnit: 'g', calories: 541, protein: 37.0, fat: 42.0, carbohydrates: 1.4, fiber: 0.0, sugar: 0.0, sodium: 1717, createdAt: now, updatedAt: now },
      { id: 47, ingredientId: 53, basisQuantity: 100, basisUnit: 'g', calories: 61, protein: 3.5, fat: 3.3, carbohydrates: 4.7, fiber: 0.0, sugar: 4.7, sodium: 46, createdAt: now, updatedAt: now },
      { id: 48, ingredientId: 54, basisQuantity: 100, basisUnit: 'g', calories: 436, protein: 9.0, fat: 17.0, carbohydrates: 62.0, fiber: 2.2, sugar: 3.0, sodium: 1731, createdAt: now, updatedAt: now },
      { id: 49, ingredientId: 61, basisQuantity: 100, basisUnit: 'g', calories: 518, protein: 9.3, fat: 53.0, carbohydrates: 0.0, fiber: 0.0, sugar: 0.0, sodium: 55, createdAt: now, updatedAt: now },
      { id: 50, ingredientId: 62, basisQuantity: 100, basisUnit: 'g', calories: 277, protein: 16.5, fat: 23.0, carbohydrates: 0.0, fiber: 0.0, sugar: 0.0, sodium: 67, createdAt: now, updatedAt: now },
      { id: 51, ingredientId: 63, basisQuantity: 100, basisUnit: 'g', calories: 158, protein: 13.0, fat: 11.0, carbohydrates: 0.4, fiber: 0.0, sugar: 0.4, sodium: 141, createdAt: now, updatedAt: now },
      { id: 52, ingredientId: 64, basisQuantity: 100, basisUnit: 'g', calories: 15, protein: 1.4, fat: 0.2, carbohydrates: 2.9, fiber: 1.3, sugar: 0.8, sodium: 28, createdAt: now, updatedAt: now }
    ],
  });
}

// ============================================================================
// 4. recipes
// ============================================================================

async function seedRecipes() {
  await prisma.recipe.createMany({
    data: [
      {
        id: 1, authorId: 1, title: 'Phở bò', servings: 4, readyInMinutes: 180,
        diets: [], dishTypes: ["main course", "soup"],
        steps: '1. Ninh xương bò với hành tây và gừng nướng trong khoảng 3 tiếng, hớt bọt thường xuyên để nước trong.\n2. Nêm nước dùng với nước mắm, một chút muối cho vừa khẩu vị.\n3. Trụng bánh phở qua nước sôi, cho vào tô.\n4. Xếp thịt bò thái mỏng lên trên, chan nước dùng đang sôi để thịt vừa chín tới.\n5. Rắc hành lá, rau mùi thái nhỏ; ăn kèm chanh cắt múi.',
        imageUrl: '/uploads/recipes/pho-bo.jpg', videoUrl: null,
        nutrition: {"calories": 420, "protein": 28, "fat": 10, "carbohydrates": 55}, nutritionCoverage: NutritionCoverage.FULL, nutritionUpdatedAt: new Date('2025-01-20T18:30:00Z'),
        createdAt: new Date('2025-01-12T09:00:00Z'), updatedAt: new Date('2025-01-20T18:30:00Z'),
      },
      {
        id: 2, authorId: 2, title: 'Bún chả', servings: 4, readyInMinutes: 60,
        diets: [], dishTypes: ["main course"],
        steps: '1. Ướp thịt heo xay với tỏi băm, một ít nước mắm và đường trong 20 phút rồi vo viên, ép dẹt.\n2. Nướng thịt trên bếp than hoặc vỉ nướng đến khi vàng đều hai mặt.\n3. Pha nước mắm chua ngọt với tỏi, ớt băm, nước cốt chanh, đường.\n4. Trụng bún tươi, chuẩn bị rau sống và cà rốt, dưa leo bào sợi.\n5. Ăn kèm bún, rau sống, chả nướng và nước mắm chua ngọt.',
        imageUrl: '/uploads/recipes/bun-cha.jpg', videoUrl: 'https://cdn.example.com/videos/bun-cha.mp4',
        nutrition: {"calories": 520, "protein": 26, "fat": 22, "carbohydrates": 55}, nutritionCoverage: NutritionCoverage.FULL, nutritionUpdatedAt: new Date('2025-02-05T12:00:00Z'),
        createdAt: new Date('2025-01-18T10:15:00Z'), updatedAt: new Date('2025-02-05T12:00:00Z'),
      },
      {
        id: 3, authorId: 3, title: 'Gỏi cuốn', servings: 4, readyInMinutes: 30,
        diets: ["gluten-free"], dishTypes: ["appetizer"],
        steps: '1. Luộc tôm sú, bóc vỏ, chẻ đôi theo chiều dọc.\n2. Trụng bún tươi qua nước sôi, để ráo.\n3. Nhúng bánh tráng qua nước ấm cho mềm, trải ra khay.\n4. Xếp rau mùi, bún, tôm lên bánh tráng rồi cuốn chặt tay.\n5. Chấm cùng tương chấm gỏi cuốn pha sẵn.',
        imageUrl: '/uploads/recipes/goi-cuon.jpg', videoUrl: null,
        nutrition: {"calories": 180, "protein": 10, "fat": 3, "carbohydrates": 28}, nutritionCoverage: NutritionCoverage.PARTIAL, nutritionUpdatedAt: new Date('2025-02-04T08:40:00Z'),
        createdAt: new Date('2025-02-04T08:40:00Z'), updatedAt: new Date('2025-02-04T08:40:00Z'),
      },
      {
        id: 4, authorId: 4, title: 'Canh chua cá lóc', servings: 4, readyInMinutes: 45,
        diets: ["gluten-free"], dishTypes: ["main course", "soup"],
        steps: '1. Cá lóc làm sạch, cắt khúc, ướp sơ với chút muối.\n2. Đun sôi nước, cho me chua vào dầm lấy vị chua.\n3. Cho cá vào nấu chín, sau đó thêm cà chua, giá đỗ.\n4. Nêm nước mắm, đường cho vừa ăn chua ngọt.\n5. Tắt bếp, rắc rau mùi và ớt sừng thái lát.',
        imageUrl: '/uploads/recipes/canh-chua-ca-loc.jpg', videoUrl: null,
        nutrition: {"calories": 150, "protein": 20, "fat": 3, "carbohydrates": 8}, nutritionCoverage: NutritionCoverage.PARTIAL, nutritionUpdatedAt: new Date('2025-03-10T19:20:00Z'),
        createdAt: new Date('2025-02-22T17:00:00Z'), updatedAt: new Date('2025-03-10T19:20:00Z'),
      },
      {
        id: 5, authorId: 5, title: 'Thịt kho tàu', servings: 4, readyInMinutes: 90,
        diets: ["gluten-free"], dishTypes: ["main course"],
        steps: '1. Thịt ba chỉ cắt miếng vừa ăn, chần sơ qua nước sôi.\n2. Luộc chín trứng gà, bóc vỏ.\n3. Thắng đường phèn cho có màu cánh gián, cho thịt vào đảo săn.\n4. Thêm nước mắm, hành tây, nước lọc xâm xấp mặt thịt, kho lửa nhỏ khoảng 45 phút.\n5. Cho trứng vào kho thêm 15 phút cho thấm, nêm lại với tiêu xay trước khi tắt bếp.',
        imageUrl: '/uploads/recipes/thit-kho-tau.jpg', videoUrl: null,
        nutrition: {"calories": 480, "protein": 30, "fat": 32, "carbohydrates": 10}, nutritionCoverage: NutritionCoverage.PARTIAL, nutritionUpdatedAt: new Date('2025-03-03T09:00:00Z'),
        createdAt: new Date('2025-03-03T09:00:00Z'), updatedAt: new Date('2025-03-03T09:00:00Z'),
      },
      {
        id: 6, authorId: 6, title: 'Rau muống xào tỏi', servings: 2, readyInMinutes: 15,
        diets: ["vegetarian", "vegan", "gluten-free"], dishTypes: ["side dish"],
        steps: '1. Rau muống nhặt bỏ lá già, rửa sạch, để ráo.\n2. Phi thơm tỏi băm với dầu ăn.\n3. Cho rau muống vào xào nhanh tay trên lửa lớn.\n4. Nêm nước mắm, muối vừa ăn rồi tắt bếp ngay để rau giòn xanh.',
        imageUrl: '/uploads/recipes/rau-muong-xao-toi.jpg', videoUrl: null,
        nutrition: {"calories": 90, "protein": 3, "fat": 6, "carbohydrates": 6}, nutritionCoverage: NutritionCoverage.FULL, nutritionUpdatedAt: new Date('2025-03-20T11:30:00Z'),
        createdAt: new Date('2025-03-20T11:30:00Z'), updatedAt: new Date('2025-03-20T11:30:00Z'),
      },
      {
        id: 7, authorId: 8, title: 'Trứng chiên cà chua', servings: 2, readyInMinutes: 15,
        diets: ["vegetarian", "gluten-free"], dishTypes: ["main course"],
        steps: '1. Cà chua rửa sạch, thái múi cau; hành lá thái nhỏ.\n2. Đánh tan trứng gà, nêm chút muối.\n3. Phi cà chua với dầu ăn cho mềm, đổ trứng vào.\n4. Đảo đều đến khi trứng chín, rắc hành lá và tiêu xay lên trên.',
        imageUrl: '/uploads/recipes/trung-chien-ca-chua.jpg', videoUrl: null,
        nutrition: {"calories": 160, "protein": 9, "fat": 12, "carbohydrates": 5}, nutritionCoverage: NutritionCoverage.PARTIAL, nutritionUpdatedAt: new Date('2025-04-25T07:15:00Z'),
        createdAt: new Date('2025-04-25T07:15:00Z'), updatedAt: new Date('2025-04-25T07:15:00Z'),
      },
      {
        id: 8, authorId: 1, title: 'Gà kho gừng', servings: 4, readyInMinutes: 40,
        diets: ["gluten-free"], dishTypes: ["main course"],
        steps: '1. Ức gà cắt miếng vừa ăn, ướp với nước mắm, đường trong 15 phút.\n2. Gừng thái sợi, phi thơm với chút dầu ăn.\n3. Cho gà vào áp chảo săn mặt, thêm gừng đã phi.\n4. Đổ xâm xấp nước, kho lửa nhỏ đến khi cạn sệt lại.\n5. Rắc hành lá, tiêu xay trước khi dọn ra đĩa.',
        imageUrl: '/uploads/recipes/ga-kho-gung.jpg', videoUrl: null,
        nutrition: {"calories": 210, "protein": 28, "fat": 8, "carbohydrates": 6}, nutritionCoverage: NutritionCoverage.PARTIAL, nutritionUpdatedAt: new Date('2025-05-15T20:10:00Z'),
        createdAt: new Date('2025-05-02T18:00:00Z'), updatedAt: new Date('2025-05-15T20:10:00Z'),
      },
      {
        id: 9, authorId: 2, title: 'Salad trộn dầu giấm', servings: 2, readyInMinutes: 10,
        diets: ["vegetarian", "vegan", "gluten-free", "low-carb"], dishTypes: ["salad", "appetizer"],
        steps: '1. Xà lách, dưa leo, cà chua rửa sạch, để ráo, cắt vừa ăn.\n2. Pha nước sốt gồm dầu ăn, giấm, đường trắng, khuấy đều.\n3. Trộn rau củ với nước sốt ngay trước khi ăn để rau không bị mềm.',
        imageUrl: '/uploads/recipes/salad-dau-giam.jpg', videoUrl: null,
        nutrition: {"calories": 95, "protein": 2, "fat": 7, "carbohydrates": 8}, nutritionCoverage: NutritionCoverage.FULL, nutritionUpdatedAt: new Date('2025-05-18T12:00:00Z'),
        createdAt: new Date('2025-05-18T12:00:00Z'), updatedAt: new Date('2025-05-18T12:00:00Z'),
      },
      {
        id: 10, authorId: 3, title: 'Chè chuối', servings: 4, readyInMinutes: 30,
        diets: ["vegetarian"], dishTypes: ["dessert"],
        steps: '1. Chuối bóc vỏ, cắt khúc vừa ăn.\n2. Hòa bột năng với chút nước lạnh.\n3. Đun nước cốt dừa với đường trắng cho tan, thả chuối vào nấu 10 phút.\n4. Đổ từ từ bột năng đã hòa vào, khuấy đều đến khi sánh lại, nêm chút muối rồi tắt bếp.',
        imageUrl: '/uploads/recipes/che-chuoi.jpg', videoUrl: 'https://cdn.example.com/videos/che-chuoi.mp4',
        nutrition: {"calories": 260, "protein": 3, "fat": 10, "carbohydrates": 42}, nutritionCoverage: NutritionCoverage.PARTIAL, nutritionUpdatedAt: new Date('2025-06-01T15:00:00Z'),
        createdAt: new Date('2025-06-01T15:00:00Z'), updatedAt: new Date('2025-06-01T15:00:00Z'),
      }
    ],
  });
}

// ============================================================================
// 5. recipe_ingredients
// ============================================================================

async function seedRecipeIngredients() {
  await prisma.recipeIngredient.createMany({
    data: [
      { id: 1, recipeId: 1, ingredientId: 11, nameVi: 'Bánh phở', nameEn: 'Pho rice noodles', quantity: 400, unit: 'g', sortOrder: 1 },
      { id: 2, recipeId: 1, ingredientId: 6, nameVi: 'Thịt bò thăn', nameEn: 'Beef tenderloin', quantity: 300, unit: 'g', sortOrder: 2 },
      { id: 3, recipeId: 1, ingredientId: 24, nameVi: 'Hành tây', nameEn: 'Onion', quantity: 1, unit: 'củ', sortOrder: 3 },
      { id: 4, recipeId: 1, ingredientId: 26, nameVi: 'Gừng', nameEn: 'Ginger', quantity: 1, unit: 'củ', sortOrder: 4 },
      { id: 5, recipeId: 1, ingredientId: 28, nameVi: 'Hành lá', nameEn: 'Scallion', quantity: 3, unit: 'cây', sortOrder: 5 },
      { id: 6, recipeId: 1, ingredientId: 35, nameVi: 'Rau mùi', nameEn: 'Cilantro', quantity: 1, unit: 'bó', sortOrder: 6 },
      { id: 7, recipeId: 1, ingredientId: 22, nameVi: 'Chanh', nameEn: 'Lime', quantity: 2, unit: 'quả', sortOrder: 7 },
      { id: 8, recipeId: 1, ingredientId: 41, nameVi: 'Nước mắm', nameEn: 'Fish sauce', quantity: 2, unit: 'muỗng canh', sortOrder: 8 },
      { id: 9, recipeId: 2, ingredientId: 5, nameVi: 'Thịt heo xay', nameEn: 'Ground pork', quantity: 400, unit: 'g', sortOrder: 1 },
      { id: 10, recipeId: 2, ingredientId: 10, nameVi: 'Bún tươi', nameEn: 'Fresh rice vermicelli', quantity: 300, unit: 'g', sortOrder: 2 },
      { id: 11, recipeId: 2, ingredientId: 25, nameVi: 'Tỏi', nameEn: 'Garlic', quantity: 3, unit: 'tép', sortOrder: 3 },
      { id: 12, recipeId: 2, ingredientId: 27, nameVi: 'Ớt sừng', nameEn: 'Chili pepper', quantity: 2, unit: 'trái', sortOrder: 4 },
      { id: 13, recipeId: 2, ingredientId: 22, nameVi: 'Chanh', nameEn: 'Lime', quantity: 2, unit: 'quả', sortOrder: 5 },
      { id: 14, recipeId: 2, ingredientId: 41, nameVi: 'Nước mắm', nameEn: 'Fish sauce', quantity: 3, unit: 'muỗng canh', sortOrder: 6 },
      { id: 15, recipeId: 2, ingredientId: 3, nameVi: 'Đường trắng', nameEn: 'White sugar', quantity: 2, unit: 'muỗng canh', sortOrder: 7 },
      { id: 16, recipeId: 2, ingredientId: 35, nameVi: 'Rau mùi', nameEn: 'Cilantro', quantity: 1, unit: 'bó', sortOrder: 8 },
      { id: 17, recipeId: 2, ingredientId: 36, nameVi: 'Dưa leo', nameEn: 'Cucumber', quantity: 1, unit: 'quả', sortOrder: 9 },
      { id: 18, recipeId: 2, ingredientId: 31, nameVi: 'Cà rốt', nameEn: 'Carrot', quantity: 1, unit: 'củ', sortOrder: 10 },
      { id: 19, recipeId: 3, ingredientId: 55, nameVi: 'Bánh tráng', nameEn: 'Rice paper', quantity: 12, unit: 'cái', sortOrder: 1 },
      { id: 20, recipeId: 3, ingredientId: 8, nameVi: 'Tôm sú', nameEn: 'Tiger shrimp', quantity: 200, unit: 'g', sortOrder: 2 },
      { id: 21, recipeId: 3, ingredientId: 10, nameVi: 'Bún tươi', nameEn: 'Fresh rice vermicelli', quantity: 150, unit: 'g', sortOrder: 3 },
      { id: 22, recipeId: 3, ingredientId: 35, nameVi: 'Rau mùi', nameEn: 'Cilantro', quantity: 1, unit: 'bó', sortOrder: 4 },
      { id: 23, recipeId: 3, ingredientId: 36, nameVi: 'Dưa leo', nameEn: 'Cucumber', quantity: 1, unit: 'quả', sortOrder: 5 },
      { id: 24, recipeId: 3, ingredientId: 17, nameVi: 'Đậu phộng rang', nameEn: 'Roasted peanuts', quantity: 30, unit: 'g', sortOrder: 6 },
      { id: 25, recipeId: 3, ingredientId: null, nameVi: 'Tương chấm gỏi cuốn', nameEn: null, quantity: null, unit: 'vừa đủ', sortOrder: 7 },
      { id: 26, recipeId: 4, ingredientId: 9, nameVi: 'Cá lóc', nameEn: 'Snakehead fish', quantity: 500, unit: 'g', sortOrder: 1 },
      { id: 27, recipeId: 4, ingredientId: 23, nameVi: 'Cà chua', nameEn: 'Tomato', quantity: 2, unit: 'quả', sortOrder: 2 },
      { id: 28, recipeId: 4, ingredientId: 19, nameVi: 'Giá đỗ', nameEn: 'Bean sprouts', quantity: 100, unit: 'g', sortOrder: 3 },
      { id: 29, recipeId: 4, ingredientId: 35, nameVi: 'Rau mùi', nameEn: 'Cilantro', quantity: 1, unit: 'bó', sortOrder: 4 },
      { id: 30, recipeId: 4, ingredientId: 27, nameVi: 'Ớt sừng', nameEn: 'Chili pepper', quantity: 1, unit: 'trái', sortOrder: 5 },
      { id: 31, recipeId: 4, ingredientId: 41, nameVi: 'Nước mắm', nameEn: 'Fish sauce', quantity: 2, unit: 'muỗng canh', sortOrder: 6 },
      { id: 32, recipeId: 4, ingredientId: null, nameVi: 'Me chua', nameEn: null, quantity: 30, unit: 'g', sortOrder: 7 },
      { id: 33, recipeId: 5, ingredientId: 61, nameVi: 'Thịt ba chỉ', nameEn: 'Pork belly', quantity: 500, unit: 'g', sortOrder: 1 },
      { id: 34, recipeId: 5, ingredientId: 21, nameVi: 'Trứng gà', nameEn: 'Chicken egg', quantity: 6, unit: 'quả', sortOrder: 2 },
      { id: 35, recipeId: 5, ingredientId: 41, nameVi: 'Nước mắm', nameEn: 'Fish sauce', quantity: 3, unit: 'muỗng canh', sortOrder: 3 },
      { id: 36, recipeId: 5, ingredientId: 15, nameVi: 'Đường phèn', nameEn: 'Rock sugar', quantity: 2, unit: 'muỗng canh', sortOrder: 4 },
      { id: 37, recipeId: 5, ingredientId: 24, nameVi: 'Hành tây', nameEn: 'Onion', quantity: 1, unit: 'củ', sortOrder: 5 },
      { id: 38, recipeId: 5, ingredientId: 57, nameVi: 'Tiêu xay', nameEn: 'Ground pepper', quantity: 1, unit: 'muỗng cà phê', sortOrder: 6 },
      { id: 39, recipeId: 6, ingredientId: 39, nameVi: 'Rau muống', nameEn: 'Water spinach', quantity: 300, unit: 'g', sortOrder: 1 },
      { id: 40, recipeId: 6, ingredientId: 25, nameVi: 'Tỏi', nameEn: 'Garlic', quantity: 3, unit: 'tép', sortOrder: 2 },
      { id: 41, recipeId: 6, ingredientId: 40, nameVi: 'Dầu ăn', nameEn: 'Cooking oil', quantity: 2, unit: 'muỗng canh', sortOrder: 3 },
      { id: 42, recipeId: 6, ingredientId: 41, nameVi: 'Nước mắm', nameEn: 'Fish sauce', quantity: 1, unit: 'muỗng canh', sortOrder: 4 },
      { id: 43, recipeId: 6, ingredientId: 4, nameVi: 'Muối ăn', nameEn: 'Salt', quantity: 1, unit: 'muỗng cà phê', sortOrder: 5 },
      { id: 44, recipeId: 7, ingredientId: 21, nameVi: 'Trứng gà', nameEn: 'Chicken egg', quantity: 4, unit: 'quả', sortOrder: 1 },
      { id: 45, recipeId: 7, ingredientId: 23, nameVi: 'Cà chua', nameEn: 'Tomato', quantity: 3, unit: 'quả', sortOrder: 2 },
      { id: 46, recipeId: 7, ingredientId: 28, nameVi: 'Hành lá', nameEn: 'Scallion', quantity: 2, unit: 'cây', sortOrder: 3 },
      { id: 47, recipeId: 7, ingredientId: 40, nameVi: 'Dầu ăn', nameEn: 'Cooking oil', quantity: 2, unit: 'muỗng canh', sortOrder: 4 },
      { id: 48, recipeId: 7, ingredientId: 4, nameVi: 'Muối ăn', nameEn: 'Salt', quantity: 1, unit: 'muỗng cà phê', sortOrder: 5 },
      { id: 49, recipeId: 7, ingredientId: 57, nameVi: 'Tiêu xay', nameEn: 'Ground pepper', quantity: 1, unit: 'muỗng cà phê', sortOrder: 6 },
      { id: 50, recipeId: 8, ingredientId: 7, nameVi: 'Ức gà', nameEn: 'Chicken breast', quantity: 500, unit: 'g', sortOrder: 1 },
      { id: 51, recipeId: 8, ingredientId: 26, nameVi: 'Gừng', nameEn: 'Ginger', quantity: 1, unit: 'củ', sortOrder: 2 },
      { id: 52, recipeId: 8, ingredientId: 41, nameVi: 'Nước mắm', nameEn: 'Fish sauce', quantity: 3, unit: 'muỗng canh', sortOrder: 3 },
      { id: 53, recipeId: 8, ingredientId: 3, nameVi: 'Đường trắng', nameEn: 'White sugar', quantity: 1, unit: 'muỗng canh', sortOrder: 4 },
      { id: 54, recipeId: 8, ingredientId: 28, nameVi: 'Hành lá', nameEn: 'Scallion', quantity: 2, unit: 'cây', sortOrder: 5 },
      { id: 55, recipeId: 8, ingredientId: 57, nameVi: 'Tiêu xay', nameEn: 'Ground pepper', quantity: 1, unit: 'muỗng cà phê', sortOrder: 6 },
      { id: 56, recipeId: 9, ingredientId: 64, nameVi: 'Xà lách', nameEn: 'Lettuce', quantity: 100, unit: 'g', sortOrder: 1 },
      { id: 57, recipeId: 9, ingredientId: 36, nameVi: 'Dưa leo', nameEn: 'Cucumber', quantity: 1, unit: 'quả', sortOrder: 2 },
      { id: 58, recipeId: 9, ingredientId: 23, nameVi: 'Cà chua', nameEn: 'Tomato', quantity: 2, unit: 'quả', sortOrder: 3 },
      { id: 59, recipeId: 9, ingredientId: 40, nameVi: 'Dầu ăn', nameEn: 'Cooking oil', quantity: 2, unit: 'muỗng canh', sortOrder: 4 },
      { id: 60, recipeId: 9, ingredientId: 44, nameVi: 'Giấm', nameEn: 'Vinegar', quantity: 1, unit: 'muỗng canh', sortOrder: 5 },
      { id: 61, recipeId: 9, ingredientId: 3, nameVi: 'Đường trắng', nameEn: 'White sugar', quantity: 1, unit: 'muỗng cà phê', sortOrder: 6 },
      { id: 62, recipeId: 10, ingredientId: 29, nameVi: 'Chuối', nameEn: 'Banana', quantity: 6, unit: 'quả', sortOrder: 1 },
      { id: 63, recipeId: 10, ingredientId: 47, nameVi: 'Nước cốt dừa', nameEn: 'Coconut milk', quantity: 1, unit: 'lon', sortOrder: 2 },
      { id: 64, recipeId: 10, ingredientId: 3, nameVi: 'Đường trắng', nameEn: 'White sugar', quantity: 100, unit: 'g', sortOrder: 3 },
      { id: 65, recipeId: 10, ingredientId: 14, nameVi: 'Bột năng', nameEn: 'Tapioca starch', quantity: 2, unit: 'muỗng canh', sortOrder: 4 },
      { id: 66, recipeId: 10, ingredientId: 4, nameVi: 'Muối ăn', nameEn: 'Salt', quantity: null, unit: 'ít', sortOrder: 5 }
    ],
  });
}

// ============================================================================
// 6. favorites
// ============================================================================

async function seedFavorites() {
  await prisma.favorite.createMany({
    data: [
      { id: 1, userId: 1, recipeId: '1', source: RecipeSource.LOCAL, titleSnapshot: 'Phở bò', imageSnapshot: '/uploads/recipes/pho-bo.jpg', createdAt: new Date('2025-01-25T20:00:00Z') },
      { id: 2, userId: 2, recipeId: '6', source: RecipeSource.LOCAL, titleSnapshot: 'Rau muống xào tỏi', imageSnapshot: '/uploads/recipes/rau-muong-xao-toi.jpg', createdAt: new Date('2025-03-21T08:00:00Z') },
      { id: 3, userId: 3, recipeId: '2', source: RecipeSource.LOCAL, titleSnapshot: 'Bún chả', imageSnapshot: '/uploads/recipes/bun-cha.jpg', createdAt: new Date('2025-02-10T19:30:00Z') },
      { id: 4, userId: 1, recipeId: '716429', source: RecipeSource.SPOONACULAR, titleSnapshot: 'Spaghetti Carbonara', imageSnapshot: null, createdAt: new Date('2025-02-14T21:15:00Z') },
      { id: 5, userId: 4, recipeId: '5', source: RecipeSource.LOCAL, titleSnapshot: 'Thịt kho tàu', imageSnapshot: '/uploads/recipes/thit-kho-tau.jpg', createdAt: new Date('2025-03-08T12:00:00Z') },
      { id: 6, userId: 5, recipeId: '644387', source: RecipeSource.SPOONACULAR, titleSnapshot: 'Garlic Butter Shrimp', imageSnapshot: null, createdAt: new Date('2025-03-12T18:45:00Z') },
      { id: 7, userId: 2, recipeId: '9', source: RecipeSource.LOCAL, titleSnapshot: 'Salad trộn dầu giấm', imageSnapshot: '/uploads/recipes/salad-dau-giam.jpg', createdAt: new Date('2025-05-19T07:30:00Z') },
      { id: 8, userId: 6, recipeId: '3', source: RecipeSource.LOCAL, titleSnapshot: 'Gỏi cuốn', imageSnapshot: '/uploads/recipes/goi-cuon.jpg', createdAt: new Date('2025-02-06T11:00:00Z') },
      { id: 9, userId: 3, recipeId: '782601', source: RecipeSource.SPOONACULAR, titleSnapshot: 'Thai Green Curry', imageSnapshot: null, createdAt: new Date('2025-04-01T13:20:00Z') },
      { id: 10, userId: 8, recipeId: '8', source: RecipeSource.LOCAL, titleSnapshot: 'Gà kho gừng', imageSnapshot: '/uploads/recipes/ga-kho-gung.jpg', createdAt: new Date('2025-05-16T21:00:00Z') },
      { id: 11, userId: 4, recipeId: '654959', source: RecipeSource.SPOONACULAR, titleSnapshot: 'Classic Greek Salad', imageSnapshot: null, createdAt: new Date('2025-04-18T09:10:00Z') },
      { id: 12, userId: 3, recipeId: '10', source: RecipeSource.LOCAL, titleSnapshot: 'Chè chuối', imageSnapshot: '/uploads/recipes/che-chuoi.jpg', createdAt: new Date('2025-06-02T16:00:00Z') }
    ],
  });
}

// ============================================================================
// 7. shopping_items
// ============================================================================

async function seedShoppingItems() {
  await prisma.shoppingItem.createMany({
    data: [
      { id: 1, userId: 1, name: 'Bánh phở', quantity: '400g', note: null, checked: false, sourceRecipeId: '1', source: RecipeSource.LOCAL, recipeTitleSnapshot: 'Phở bò', createdAt: new Date('2025-01-26T07:00:00Z'), updatedAt: new Date('2025-01-26T07:00:00Z') },
      { id: 2, userId: 1, name: 'Thịt bò thăn', quantity: '300g', note: null, checked: false, sourceRecipeId: '1', source: RecipeSource.LOCAL, recipeTitleSnapshot: 'Phở bò', createdAt: new Date('2025-01-26T07:00:00Z'), updatedAt: new Date('2025-01-26T07:00:00Z') },
      { id: 3, userId: 1, name: 'Sữa tươi', quantity: '1 lít', note: 'Mua loại không đường', checked: true, sourceRecipeId: null, source: null, recipeTitleSnapshot: null, createdAt: new Date('2025-01-27T09:00:00Z'), updatedAt: new Date('2025-01-28T18:00:00Z') },
      { id: 4, userId: 2, name: 'Trứng gà', quantity: '1 chục', note: null, checked: false, sourceRecipeId: null, source: null, recipeTitleSnapshot: null, createdAt: new Date('2025-02-11T08:30:00Z'), updatedAt: new Date('2025-02-11T08:30:00Z') },
      { id: 5, userId: 2, name: 'Rau muống', quantity: '2 bó', note: null, checked: true, sourceRecipeId: '6', source: RecipeSource.LOCAL, recipeTitleSnapshot: 'Rau muống xào tỏi', createdAt: new Date('2025-03-21T08:05:00Z'), updatedAt: new Date('2025-03-22T17:00:00Z') },
      { id: 6, userId: 3, name: 'Tôm sú', quantity: '200g', note: null, checked: false, sourceRecipeId: '3', source: RecipeSource.LOCAL, recipeTitleSnapshot: 'Gỏi cuốn', createdAt: new Date('2025-02-06T11:05:00Z'), updatedAt: new Date('2025-02-06T11:05:00Z') },
      { id: 7, userId: 3, name: 'Nước rửa chén', quantity: null, note: 'Hết rồi, nhớ mua', checked: false, sourceRecipeId: null, source: null, recipeTitleSnapshot: null, createdAt: new Date('2025-02-15T20:00:00Z'), updatedAt: new Date('2025-02-15T20:00:00Z') },
      { id: 8, userId: 4, name: 'Thịt ba chỉ', quantity: '500g', note: null, checked: true, sourceRecipeId: '5', source: RecipeSource.LOCAL, recipeTitleSnapshot: 'Thịt kho tàu', createdAt: new Date('2025-03-08T12:05:00Z'), updatedAt: new Date('2025-03-09T19:00:00Z') },
      { id: 9, userId: 5, name: 'Bột giặt', quantity: null, note: null, checked: false, sourceRecipeId: null, source: null, recipeTitleSnapshot: null, createdAt: new Date('2025-03-13T10:00:00Z'), updatedAt: new Date('2025-03-13T10:00:00Z') },
      { id: 10, userId: 6, name: 'Xà lách', quantity: '1 cây', note: null, checked: false, sourceRecipeId: '9', source: RecipeSource.LOCAL, recipeTitleSnapshot: 'Salad trộn dầu giấm', createdAt: new Date('2025-05-19T07:35:00Z'), updatedAt: new Date('2025-05-19T07:35:00Z') }
    ],
  });
}

// ============================================================================
// 8. recipe_reviews
// ============================================================================

async function seedRecipeReviews() {
  await prisma.recipeReview.createMany({
    data: [
      { id: 1, userId: 2, recipeId: '1', source: RecipeSource.LOCAL, titleSnapshot: 'Phở bò', imageSnapshot: '/uploads/recipes/pho-bo.jpg', rating: 5, comment: 'Nước dùng đậm đà, y như ngoài hàng!', createdAt: new Date('2025-01-22T19:00:00Z'), updatedAt: new Date('2025-01-22T19:00:00Z') },
      { id: 2, userId: 3, recipeId: '1', source: RecipeSource.LOCAL, titleSnapshot: 'Phở bò', imageSnapshot: '/uploads/recipes/pho-bo.jpg', rating: 4, comment: 'Ngon nhưng hơi mặn với khẩu vị mình.', createdAt: new Date('2025-01-24T20:15:00Z'), updatedAt: new Date('2025-01-25T08:00:00Z') },
      { id: 3, userId: 4, recipeId: '2', source: RecipeSource.LOCAL, titleSnapshot: 'Bún chả', imageSnapshot: '/uploads/recipes/bun-cha.jpg', rating: 5, comment: 'Thịt nướng thơm, công thức dễ làm theo.', createdAt: new Date('2025-02-08T12:30:00Z'), updatedAt: new Date('2025-02-08T12:30:00Z') },
      { id: 4, userId: 1, recipeId: '6', source: RecipeSource.LOCAL, titleSnapshot: 'Rau muống xào tỏi', imageSnapshot: '/uploads/recipes/rau-muong-xao-toi.jpg', rating: 5, comment: 'Món nhanh gọn cho bữa tối bận rộn.', createdAt: new Date('2025-03-22T20:00:00Z'), updatedAt: new Date('2025-03-22T20:00:00Z') },
      { id: 5, userId: 5, recipeId: '5', source: RecipeSource.LOCAL, titleSnapshot: 'Thịt kho tàu', imageSnapshot: '/uploads/recipes/thit-kho-tau.jpg', rating: 4, comment: 'Vị vừa ăn, trứng thấm gia vị.', createdAt: new Date('2025-03-06T18:00:00Z'), updatedAt: new Date('2025-03-06T18:00:00Z') },
      { id: 6, userId: 6, recipeId: '9', source: RecipeSource.LOCAL, titleSnapshot: 'Salad trộn dầu giấm', imageSnapshot: '/uploads/recipes/salad-dau-giam.jpg', rating: 3, comment: 'Ổn nhưng cần thêm chút vị chua.', createdAt: new Date('2025-05-20T09:00:00Z'), updatedAt: new Date('2025-05-21T10:00:00Z') },
      { id: 7, userId: 8, recipeId: '716429', source: RecipeSource.SPOONACULAR, titleSnapshot: 'Spaghetti Carbonara', imageSnapshot: null, rating: 4, comment: 'Công thức nước ngoài nhưng dễ biến tấu theo khẩu vị Việt.', createdAt: new Date('2025-02-16T21:00:00Z'), updatedAt: new Date('2025-02-16T21:00:00Z') },
      { id: 8, userId: 2, recipeId: '3', source: RecipeSource.LOCAL, titleSnapshot: 'Gỏi cuốn', imageSnapshot: '/uploads/recipes/goi-cuon.jpg', rating: 5, comment: 'Cuốn chặt tay, ăn kèm nước chấm rất hợp.', createdAt: new Date('2025-02-07T11:30:00Z'), updatedAt: new Date('2025-02-07T11:30:00Z') },
      { id: 9, userId: 4, recipeId: '8', source: RecipeSource.LOCAL, titleSnapshot: 'Gà kho gừng', imageSnapshot: '/uploads/recipes/ga-kho-gung.jpg', rating: 4, comment: 'Gừng thơm, thịt gà mềm.', createdAt: new Date('2025-05-17T19:30:00Z'), updatedAt: new Date('2025-05-17T19:30:00Z') },
      { id: 10, userId: 5, recipeId: '10', source: RecipeSource.LOCAL, titleSnapshot: 'Chè chuối', imageSnapshot: '/uploads/recipes/che-chuoi.jpg', rating: 5, comment: 'Ngọt thanh, nước cốt dừa béo vừa phải.', createdAt: new Date('2025-06-03T16:30:00Z'), updatedAt: new Date('2025-06-03T16:30:00Z') }
    ],
  });
}

// ============================================================================
// 9. meal_plan_entries
// ============================================================================

async function seedMealPlanEntries() {
  await prisma.mealPlanEntry.createMany({
    data: [
      { id: 1, userId: 1, date: new Date('2025-06-16T00:00:00Z'), mealSlot: MealSlot.BREAKFAST, recipeId: '7', source: RecipeSource.LOCAL, titleSnapshot: 'Trứng chiên cà chua', imageSnapshot: '/uploads/recipes/trung-chien-ca-chua.jpg', createdAt: new Date('2025-06-14T20:00:00Z'), updatedAt: new Date('2025-06-14T20:00:00Z') },
      { id: 2, userId: 1, date: new Date('2025-06-16T00:00:00Z'), mealSlot: MealSlot.DINNER, recipeId: '1', source: RecipeSource.LOCAL, titleSnapshot: 'Phở bò', imageSnapshot: '/uploads/recipes/pho-bo.jpg', createdAt: new Date('2025-06-14T20:00:00Z'), updatedAt: new Date('2025-06-14T20:00:00Z') },
      { id: 3, userId: 1, date: new Date('2025-06-17T00:00:00Z'), mealSlot: MealSlot.LUNCH, recipeId: '2', source: RecipeSource.LOCAL, titleSnapshot: 'Bún chả', imageSnapshot: '/uploads/recipes/bun-cha.jpg', createdAt: new Date('2025-06-14T20:05:00Z'), updatedAt: new Date('2025-06-14T20:05:00Z') },
      { id: 4, userId: 1, date: new Date('2025-06-18T00:00:00Z'), mealSlot: MealSlot.DINNER, recipeId: '6', source: RecipeSource.LOCAL, titleSnapshot: 'Rau muống xào tỏi', imageSnapshot: '/uploads/recipes/rau-muong-xao-toi.jpg', createdAt: new Date('2025-06-14T20:05:00Z'), updatedAt: new Date('2025-06-14T20:05:00Z') },
      { id: 5, userId: 2, date: new Date('2025-06-16T00:00:00Z'), mealSlot: MealSlot.LUNCH, recipeId: '9', source: RecipeSource.LOCAL, titleSnapshot: 'Salad trộn dầu giấm', imageSnapshot: '/uploads/recipes/salad-dau-giam.jpg', createdAt: new Date('2025-06-15T09:00:00Z'), updatedAt: new Date('2025-06-15T09:00:00Z') },
      { id: 6, userId: 2, date: new Date('2025-06-17T00:00:00Z'), mealSlot: MealSlot.DINNER, recipeId: '5', source: RecipeSource.LOCAL, titleSnapshot: 'Thịt kho tàu', imageSnapshot: '/uploads/recipes/thit-kho-tau.jpg', createdAt: new Date('2025-06-15T09:00:00Z'), updatedAt: new Date('2025-06-15T09:00:00Z') },
      { id: 7, userId: 2, date: new Date('2025-06-19T00:00:00Z'), mealSlot: MealSlot.LUNCH, recipeId: '716429', source: RecipeSource.SPOONACULAR, titleSnapshot: 'Spaghetti Carbonara', imageSnapshot: null, createdAt: new Date('2025-06-15T09:05:00Z'), updatedAt: new Date('2025-06-15T09:05:00Z') },
      { id: 8, userId: 3, date: new Date('2025-06-16T00:00:00Z'), mealSlot: MealSlot.DINNER, recipeId: '3', source: RecipeSource.LOCAL, titleSnapshot: 'Gỏi cuốn', imageSnapshot: '/uploads/recipes/goi-cuon.jpg', createdAt: new Date('2025-06-15T14:00:00Z'), updatedAt: new Date('2025-06-15T14:00:00Z') },
      { id: 9, userId: 3, date: new Date('2025-06-18T00:00:00Z'), mealSlot: MealSlot.LUNCH, recipeId: '4', source: RecipeSource.LOCAL, titleSnapshot: 'Canh chua cá lóc', imageSnapshot: '/uploads/recipes/canh-chua-ca-loc.jpg', createdAt: new Date('2025-06-15T14:05:00Z'), updatedAt: new Date('2025-06-15T14:05:00Z') },
      { id: 10, userId: 4, date: new Date('2025-06-17T00:00:00Z'), mealSlot: MealSlot.DINNER, recipeId: '8', source: RecipeSource.LOCAL, titleSnapshot: 'Gà kho gừng', imageSnapshot: '/uploads/recipes/ga-kho-gung.jpg', createdAt: new Date('2025-06-16T08:00:00Z'), updatedAt: new Date('2025-06-16T08:00:00Z') },
      { id: 11, userId: 5, date: new Date('2025-06-20T00:00:00Z'), mealSlot: MealSlot.BREAKFAST, recipeId: '10', source: RecipeSource.LOCAL, titleSnapshot: 'Chè chuối', imageSnapshot: '/uploads/recipes/che-chuoi.jpg', createdAt: new Date('2025-06-16T08:10:00Z'), updatedAt: new Date('2025-06-16T08:10:00Z') },
      { id: 12, userId: 6, date: new Date('2025-06-21T00:00:00Z'), mealSlot: MealSlot.DINNER, recipeId: '1', source: RecipeSource.LOCAL, titleSnapshot: 'Phở bò', imageSnapshot: '/uploads/recipes/pho-bo.jpg', createdAt: new Date('2025-06-16T08:15:00Z'), updatedAt: new Date('2025-06-16T08:15:00Z') }
    ],
  });
}

// ============================================================================
// main
// ============================================================================
async function main() {
  await resetTables();

  await seedUsers();
  await seedIngredients();
  await seedIngredientNutrition();
  await seedRecipes();
  await seedRecipeIngredients();
  await seedFavorites();
  await seedShoppingItems();
  await seedRecipeReviews();
  await seedMealPlanEntries();

  console.log("Seed data inserted!");
  console.log(
    `Dang nhap thu bang 1 trong cac email o tren voi mat khau: "${DEMO_PASSWORD}"`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

