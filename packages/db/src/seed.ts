import { db, users, rooms, products, inventoryStocks } from './src/schema';
import { hash } from 'argon2';

async function seed() {
    console.log('🌱 Starting seed...');

    // Seed Rooms
    console.log('📦 Creating rooms...');
    const roomsData = [
        { name: 'Chemical Clinic', description: 'Chemical analysis and clinical chemistry' },
        { name: 'Hematology', description: 'Blood and blood disorders analysis' },
        { name: 'Micro Biology', description: 'Microbiological testing and analysis' },
        { name: 'Blood Bank', description: 'Blood storage and transfusion services' },
        { name: 'Immunology', description: 'Immune system and immunological testing' },
        { name: 'Micro Scopic', description: 'Microscopic examination and analysis' },
        { name: 'Sub Stocks', description: 'Secondary storage location' },
    ];

    const insertedRooms = await db.insert(rooms).values(roomsData).returning();
    console.log(`✅ Created ${insertedRooms.length} rooms`);

    // Seed SuperAdmin User
    console.log('👤 Creating superadmin user...');
    const hashedPassword = await hash('admin123');

    const [superAdmin] = await db.insert(users).values({
        username: 'superadmin',
        password: hashedPassword,
        fullName: 'Super Administrator',
        nickname: 'Admin',
        role: 'SUPERADMIN',
        isActive: true,
    }).returning();
    console.log(`✅ Created superadmin user (username: superadmin, password: admin123)`);

    // Seed Admin User
    const [admin] = await db.insert(users).values({
        username: 'admin',
        password: hashedPassword,
        fullName: 'Lab Administrator',
        nickname: 'Lab Admin',
        role: 'ADMIN',
        roomId: insertedRooms[0].id,
        isActive: true,
    }).returning();
    console.log(`✅ Created admin user (username: admin, password: admin123)`);

    // Seed General Users for each room
    console.log('👥 Creating general users...');
    const generalUsersData = await Promise.all(
        insertedRooms.map(async (room, index) => ({
            username: `user_${room.name.toLowerCase().replace(/\s+/g, '_')}`,
            password: await hash('user123'),
            fullName: `${room.name} Staff`,
            nickname: `Staff ${index + 1}`,
            role: 'GENERAL' as const,
            roomId: room.id,
            isActive: true,
        }))
    );

    const insertedUsers = await db.insert(users).values(generalUsersData).returning();
    console.log(`✅ Created ${insertedUsers.length} general users (password: user123)`);

    // Seed Products
    console.log('🏷️ Creating products...');
    const productsData = [
        { name: 'Test Tube 5ml', unit: 'pcs', description: 'Standard 5ml test tube', lowStockThreshold: 100 },
        { name: 'Test Tube 10ml', unit: 'pcs', description: 'Standard 10ml test tube', lowStockThreshold: 100 },
        { name: 'Pipette Tips 200ul', unit: 'box', description: 'Box of 200ul pipette tips', lowStockThreshold: 20 },
        { name: 'Pipette Tips 1000ul', unit: 'box', description: 'Box of 1000ul pipette tips', lowStockThreshold: 20 },
        { name: 'Examination Gloves S', unit: 'box', description: 'Small size examination gloves (100 pcs)', lowStockThreshold: 10 },
        { name: 'Examination Gloves M', unit: 'box', description: 'Medium size examination gloves (100 pcs)', lowStockThreshold: 10 },
        { name: 'Examination Gloves L', unit: 'box', description: 'Large size examination gloves (100 pcs)', lowStockThreshold: 10 },
        { name: 'Alcohol Swabs', unit: 'box', description: 'Box of alcohol swabs (100 pcs)', lowStockThreshold: 15 },
        { name: 'Syringe 3ml', unit: 'pcs', description: '3ml disposable syringe', lowStockThreshold: 200 },
        { name: 'Syringe 5ml', unit: 'pcs', description: '5ml disposable syringe', lowStockThreshold: 200 },
        { name: 'Needle 21G', unit: 'pcs', description: '21 gauge needle', lowStockThreshold: 300 },
        { name: 'Needle 23G', unit: 'pcs', description: '23 gauge needle', lowStockThreshold: 300 },
        { name: 'Blood Collection Tube EDTA', unit: 'pcs', description: 'EDTA blood collection tube', lowStockThreshold: 150 },
        { name: 'Blood Collection Tube Heparin', unit: 'pcs', description: 'Heparin blood collection tube', lowStockThreshold: 150 },
        { name: 'Centrifuge Tube 15ml', unit: 'pcs', description: '15ml centrifuge tube', lowStockThreshold: 100 },
        { name: 'Microscope Slide', unit: 'box', description: 'Box of microscope slides (50 pcs)', lowStockThreshold: 20 },
        { name: 'Cover Slip', unit: 'box', description: 'Box of cover slips (100 pcs)', lowStockThreshold: 15 },
        { name: 'Petri Dish 90mm', unit: 'pcs', description: '90mm sterile petri dish', lowStockThreshold: 50 },
        { name: 'Cotton Swab Sterile', unit: 'box', description: 'Box of sterile cotton swabs', lowStockThreshold: 20 },
        { name: 'Lab Coat Disposable', unit: 'pcs', description: 'Disposable lab coat', lowStockThreshold: 30 },
    ];

    const insertedProducts = await db.insert(products).values(productsData).returning();
    console.log(`✅ Created ${insertedProducts.length} products`);

    // Seed Inventory Stocks
    console.log('📦 Creating inventory stocks...');
    const stocksData = insertedProducts.map((product) => ({
        productId: product.id,
        quantity: Math.floor(Math.random() * 500) + (product.lowStockThreshold || 50),
    }));

    await db.insert(inventoryStocks).values(stocksData);
    console.log(`✅ Created ${stocksData.length} inventory stock records`);

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   SuperAdmin: username: superadmin, password: admin123');
    console.log('   Admin:      username: admin, password: admin123');
    console.log('   General:    username: user_<room_name>, password: user123');
}

seed()
    .then(() => {
        console.log('✅ Seed finished');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    });
