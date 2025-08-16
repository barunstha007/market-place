import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductSeeder1755241549860 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO products (name, price, stock, is_active, created_at, updated_at)
      VALUES
        ('Margherita Pizza', 8, 50, true, NOW(), NOW()),
        ('Pepperoni Pizza', 10, 40, true, NOW(), NOW()),
        ('BBQ Chicken Pizza', 12, 30, true, NOW(), NOW()),
        ('Veggie Supreme', 9, 35, true, NOW(), NOW()),
        ('Hawaiian Pizza', 11, 25, true, NOW(), NOW()),
        ('Cheeseburger', 7, 60, true, NOW(), NOW()),
        ('Chicken Burger', 6, 70, true, NOW(), NOW()),
        ('Veggie Burger', 6, 50, true, NOW(), NOW()),
        ('French Fries', 3, 100, true, NOW(), NOW()),
        ('Onion Rings', 4, 80, true, NOW(), NOW()),
        ('Coke', 1, 200, true, NOW(), NOW()),
        ('Pepsi', 1, 200, true, NOW(), NOW()),
        ('Sprite', 1, 200, true, NOW(), NOW()),
        ('Lemonade', 2, 150, true, NOW(), NOW()),
        ('Chocolate Cake', 5, 20, true, NOW(), NOW()),
        ('Cheesecake', 6, 20, true, NOW(), NOW()),
        ('Pasta Alfredo', 11, 25, true, NOW(), NOW()),
        ('Pasta Bolognese', 12, 25, true, NOW(), NOW()),
        ('Caesar Salad', 7, 40, true, NOW(), NOW()),
        ('Greek Salad', 8, 40, true, NOW(), NOW())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM products
      WHERE name IN (
        'Margherita Pizza',
        'Pepperoni Pizza',
        'BBQ Chicken Pizza',
        'Veggie Supreme',
        'Hawaiian Pizza',
        'Cheeseburger',
        'Chicken Burger',
        'Veggie Burger',
        'French Fries',
        'Onion Rings',
        'Coke',
        'Pepsi',
        'Sprite',
        'Lemonade',
        'Chocolate Cake',
        'Cheesecake',
        'Pasta Alfredo',
        'Pasta Bolognese',
        'Caesar Salad',
        'Greek Salad'
      )
    `);
  }
}
