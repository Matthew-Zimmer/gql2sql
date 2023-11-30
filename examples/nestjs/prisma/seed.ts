import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.recipe.createMany({
    data: [{
      creationDate: new Date(),
      id: "r-1",
      title: "recipe 1",
      description: "recipe 1 description",
      difficulty: "easy",
    }, {
      creationDate: new Date(),
      id: "r-2",
      title: "recipe 2",
      description: "recipe 2 description",
      difficulty: "easy",
    }, {
      creationDate: new Date(),
      id: "r-3",
      title: "recipe 3",
      description: "recipe 3 description",
      difficulty: "hard",
    }]
  });

  await prisma.ingredient.createMany({
    data: [{
      id: "i-1",
      kind: "LiquidIngredient",
      name: "water"
    }, {
      id: "i-2",
      kind: "LiquidIngredient",
      name: "oil"
    }, {
      id: "i-3",
      kind: "LiquidIngredient",
      name: "milk"
    }, {
      id: "i-4",
      kind: "SolidIngredient",
      name: "sugar"
    }, {
      id: "i-5",
      kind: "SolidIngredient",
      name: "flour"
    }, {
      id: "i-6",
      kind: "SolidIngredient",
      name: "chocolate"
    }, {
      id: "i-7",
      kind: "SolidIngredient",
      name: null,
    }]
  });

  await prisma.liquidIngredient.createMany({
    data: [{
      id: "i-1",
      amount: 50
    }, {
      id: "i-2",
      amount: 20
    }, {
      id: "i-3",
      amount: 60
    },]
  });

  await prisma.solidIngredient.createMany({
    data: [{
      id: "i-4",
      quantity: 23
    }, {
      id: "i-5",
      quantity: 14
    }, {
      id: "i-6",
      quantity: 19
    }, {
      id: "i-7",
      quantity: null
    },]
  });

  await prisma.recipeToIngredient.createMany({
    data: [{
      ingredientId: "i-1",
      recipeId: "r-1"
    }, {
      ingredientId: "i-2",
      recipeId: "r-1"
    }, {
      ingredientId: "i-4",
      recipeId: "r-1"
    }, {
      ingredientId: "i-6",
      recipeId: "r-1"
    }, {
      ingredientId: "i-7",
      recipeId: "r-1"
    }, {
      ingredientId: "i-2",
      recipeId: "r-2"
    }, {
      ingredientId: "i-3",
      recipeId: "r-2"
    }, {
      ingredientId: "i-5",
      recipeId: "r-2"
    }, {
      ingredientId: "i-6",
      recipeId: "r-2"
    }, {
      ingredientId: "i-7",
      recipeId: "r-2"
    }, {
      ingredientId: "i-1",
      recipeId: "r-3"
    }, {
      ingredientId: "i-4",
      recipeId: "r-3"
    }, {
      ingredientId: "i-5",
      recipeId: "r-3"
    }, {
      ingredientId: "i-6",
      recipeId: "r-3"
    }]
  });
}

main();