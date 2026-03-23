import { db, users, rooms, products, inventoryStocks } from './index';
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

    // Seed Products - Master Data by Category
    console.log('🏷️ Creating products...');

    const productsData = [
        // =====================
        // 1. CHEMICAL_CLINIC - เคมีคลินิก
        // =====================
        { name: 'Glucose Strip (DTX)', unit: 'กล่อง', category: 'CHEMICAL_CLINIC', lowStockThreshold: 5 },
        { name: 'เครื่อง DTX', unit: 'เครื่อง', category: 'CHEMICAL_CLINIC', lowStockThreshold: 1 },
        { name: 'Lactate', unit: 'กล่อง', category: 'CHEMICAL_CLINIC', lowStockThreshold: 5 },
        { name: 'Micro Protein CSF/Urine', unit: 'กล่อง', category: 'CHEMICAL_CLINIC', lowStockThreshold: 5 },
        { name: 'Microalbumin 14G', unit: 'กล่อง', category: 'CHEMICAL_CLINIC', lowStockThreshold: 5 },
        { name: 'Microbilirubin control', unit: 'กล่อง', category: 'CHEMICAL_CLINIC', lowStockThreshold: 5 },
        { name: 'Blood Gas cassette', unit: 'กล่อง', category: 'CHEMICAL_CLINIC', lowStockThreshold: 5 },
        { name: 'Blood Gas automate', unit: 'กล่อง', category: 'CHEMICAL_CLINIC', lowStockThreshold: 5 },
        { name: 'I smart QC blood gas', unit: 'กล่อง', category: 'CHEMICAL_CLINIC', lowStockThreshold: 3 },
        { name: 'blood gas QC1', unit: 'กล่อง', category: 'CHEMICAL_CLINIC', lowStockThreshold: 3 },
        { name: 'blood gas QC2', unit: 'กล่อง', category: 'CHEMICAL_CLINIC', lowStockThreshold: 3 },
        { name: 'blood gas QC3', unit: 'กล่อง', category: 'CHEMICAL_CLINIC', lowStockThreshold: 3 },
        { name: 'Blood Gas Syringe', unit: 'ชิ้น', category: 'CHEMICAL_CLINIC', lowStockThreshold: 50 },
        { name: 'Troponin I', unit: 'กล่อง', category: 'CHEMICAL_CLINIC', lowStockThreshold: 5 },
        { name: 'Troponin T', unit: 'กล่อง', category: 'CHEMICAL_CLINIC', lowStockThreshold: 5 },

        // =====================
        // 2. IMMUNOLOGY - ภูมิคุ้มกันวิทยา
        // =====================
        { name: 'Dengue DUO IgG/IgM/NS1Ag', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'Dengue IgG/IgM', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'Dengue NS1Ag', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'Dengue IgG/IgM Card', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'Dengue NS1Ag Card', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'HBsAg', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'Anti-HBs', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'HBsAg/HCV Combo', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'Anti-HCV', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'Anti-HIV Determine', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'Anti-HIV Retroscreen', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'Anti-HIV Wondfo', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'Syphilis Ab', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'Anti-TP', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'VDRL (RPR)', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'Leptospirosis Ab', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'Lepto IgG/IgM DUO Card', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'Tsutsugamushi Ab', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'Scrub typhus IgM/IgG Card', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'CRP', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'Rheumatoid factor', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'Covid-19 & Influenza A+B combo Rapid', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'Covid-19/RSV/Flu A+B', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'Covid Ag Test (ATK)', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 10 },
        { name: 'Influenza A/B', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'RSV', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'HAV IgG/IgM Rapid Test', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'Cryptococcal Antigen', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'Melioidosis', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },
        { name: 'U plate', unit: 'กล่อง', category: 'IMMUNOLOGY', lowStockThreshold: 5 },

        // =====================
        // 3. HEMATOLOGY - โลหิตวิทยา
        // =====================
        { name: 'DCIP', unit: 'หลอด', category: 'HEMATOLOGY', lowStockThreshold: 10 },
        { name: 'G-6-PD', unit: 'กล่อง', category: 'HEMATOLOGY', lowStockThreshold: 5 },
        { name: 'Prothrombin Time (PT)', unit: 'ชิ้น', category: 'HEMATOLOGY', lowStockThreshold: 50 },
        { name: 'PT/INR (strip wondfo)', unit: 'กล่อง', category: 'HEMATOLOGY', lowStockThreshold: 5 },
        { name: 'PT Uniplastin', unit: 'แพค', category: 'HEMATOLOGY', lowStockThreshold: 5 },
        { name: 'APTT (strip wondfo)', unit: 'กล่อง', category: 'HEMATOLOGY', lowStockThreshold: 5 },
        { name: 'APTT LiquicelinE', unit: 'แพค', category: 'HEMATOLOGY', lowStockThreshold: 5 },
        { name: 'ESR solution reagent', unit: 'ขวด', category: 'HEMATOLOGY', lowStockThreshold: 10 },
        { name: 'ESR pipette', unit: 'กล่อง', category: 'HEMATOLOGY', lowStockThreshold: 5 },
        { name: 'Reticulocyte Reagent', unit: 'ขวด', category: 'HEMATOLOGY', lowStockThreshold: 5 },
        { name: 'Wright Giemsa Stain Reagent A', unit: 'กล่อง', category: 'HEMATOLOGY', lowStockThreshold: 5 },
        { name: 'Wright Giemsa Stain Methanol', unit: 'กล่อง', category: 'HEMATOLOGY', lowStockThreshold: 5 },
        { name: 'Wright Giemsa Stain Buffer', unit: 'กล่อง', category: 'HEMATOLOGY', lowStockThreshold: 5 },

        // =====================
        // 4. MICROSCOPIC - จุลทรรศนศาสตร์
        // =====================
        { name: 'Urine strip 11G', unit: 'กล่อง', category: 'MICROSCOPIC', lowStockThreshold: 10 },
        { name: 'Urine strip 14G', unit: 'กล่อง', category: 'MICROSCOPIC', lowStockThreshold: 10 },
        { name: 'Reagent Sperm count', unit: 'กล่อง', category: 'MICROSCOPIC', lowStockThreshold: 5 },
        { name: 'FIT test', unit: 'กล่อง', category: 'MICROSCOPIC', lowStockThreshold: 5 },
        { name: 'FOB', unit: 'กล่อง', category: 'MICROSCOPIC', lowStockThreshold: 5 },
        { name: 'Methamphetamine', unit: 'กล่อง', category: 'MICROSCOPIC', lowStockThreshold: 5 },
        { name: 'THC Urine cassette', unit: 'กล่อง', category: 'MICROSCOPIC', lowStockThreshold: 5 },
        { name: 'UPT strip', unit: 'กล่อง', category: 'MICROSCOPIC', lowStockThreshold: 10 },

        // =====================
        // 5. BLOOD_BANK - ธนาคารเลือด
        // =====================
        { name: 'Blood bag 350', unit: 'ถุง', category: 'BLOOD_BANK', lowStockThreshold: 20 },
        { name: 'Blood bag 450', unit: 'ถุง', category: 'BLOOD_BANK', lowStockThreshold: 20 },
        { name: 'Gel test LISS/Coombs', unit: 'กล่อง', category: 'BLOOD_BANK', lowStockThreshold: 5 },
        { name: 'Hb microcuvette', unit: 'ชิ้น', category: 'BLOOD_BANK', lowStockThreshold: 100 },

        // =====================
        // 6. MICRO_BIOLOGY - จุลชีววิทยา
        // =====================
        { name: 'Hemoculture ผู้ใหญ่', unit: 'ขวด', category: 'MICRO_BIOLOGY', lowStockThreshold: 20 },
        { name: 'Hemoculture เด็ก', unit: 'กล่อง', category: 'MICRO_BIOLOGY', lowStockThreshold: 10 },
        { name: 'Carry Blair medium', unit: 'ชิ้น', category: 'MICRO_BIOLOGY', lowStockThreshold: 50 },
        { name: 'Stuart transport medium', unit: 'ชิ้น', category: 'MICRO_BIOLOGY', lowStockThreshold: 50 },
        { name: 'Amies transport medium', unit: 'ชิ้น', category: 'MICRO_BIOLOGY', lowStockThreshold: 50 },
        { name: 'TCBS Agar', unit: 'กล่อง', category: 'MICRO_BIOLOGY', lowStockThreshold: 5 },
        { name: 'TCBS medium', unit: 'ชิ้น', category: 'MICRO_BIOLOGY', lowStockThreshold: 50 },
        { name: 'Sheep Blood Agar', unit: 'แพค', category: 'MICRO_BIOLOGY', lowStockThreshold: 10 },
        { name: 'Chocolate Agar', unit: 'แพค', category: 'MICRO_BIOLOGY', lowStockThreshold: 10 },
        { name: 'MacConkey Agar', unit: 'แพค', category: 'MICRO_BIOLOGY', lowStockThreshold: 10 },
        { name: 'SS Agar powder', unit: 'ขวด', category: 'MICRO_BIOLOGY', lowStockThreshold: 5 },
        { name: 'Alkaline peptone water', unit: 'กล่อง', category: 'MICRO_BIOLOGY', lowStockThreshold: 5 },
        { name: 'Oxidase Strip test', unit: 'กล่อง', category: 'MICRO_BIOLOGY', lowStockThreshold: 5 },
        { name: 'Candle Jar', unit: 'อัน', category: 'MICRO_BIOLOGY', lowStockThreshold: 2 },
        { name: 'Inoculating loop 10 µL', unit: 'แพค', category: 'MICRO_BIOLOGY', lowStockThreshold: 5 },
        { name: 'Inoculating loop 1 µL', unit: 'กล่อง', category: 'MICRO_BIOLOGY', lowStockThreshold: 5 },
        { name: 'Plate sterile', unit: 'แพค', category: 'MICRO_BIOLOGY', lowStockThreshold: 10 },
        { name: 'การ์ดจำแนกแกรมบวก/ลบ', unit: 'กล่อง', category: 'MICRO_BIOLOGY', lowStockThreshold: 5 },
        { name: 'การ์ดทดสอบความไวแกรมบวก/ลบ', unit: 'กล่อง', category: 'MICRO_BIOLOGY', lowStockThreshold: 5 },
        { name: 'Salmonella O antisera (ทุกกลุ่ม)', unit: 'ขวด', category: 'MICRO_BIOLOGY', lowStockThreshold: 5 },
        { name: 'Vibrio cholerae O1/O139/Inaba/Ogawa', unit: 'กล่อง', category: 'MICRO_BIOLOGY', lowStockThreshold: 5 },
        { name: 'Xpert MTB/RIF', unit: 'กล่อง', category: 'MICRO_BIOLOGY', lowStockThreshold: 5 },
        { name: '3% H2O2', unit: 'ขวด', category: 'MICRO_BIOLOGY', lowStockThreshold: 5 },
        { name: 'Gram stain set', unit: 'กล่อง', category: 'MICRO_BIOLOGY', lowStockThreshold: 5 },
        { name: 'Gram crystal violet', unit: 'ขวด', category: 'MICRO_BIOLOGY', lowStockThreshold: 5 },
        { name: 'Gram iodine', unit: 'ขวด', category: 'MICRO_BIOLOGY', lowStockThreshold: 5 },
        { name: 'Gram decolorizer', unit: 'ขวด', category: 'MICRO_BIOLOGY', lowStockThreshold: 5 },
        { name: 'Gram Safranin', unit: 'ขวด', category: 'MICRO_BIOLOGY', lowStockThreshold: 5 },
        { name: 'AFB set', unit: 'กล่อง', category: 'MICRO_BIOLOGY', lowStockThreshold: 5 },
        { name: 'Acid alcohol (AFB)', unit: 'ขวด', category: 'MICRO_BIOLOGY', lowStockThreshold: 5 },
        { name: 'Carbon fuchsin (AFB)', unit: 'ขวด', category: 'MICRO_BIOLOGY', lowStockThreshold: 5 },
        { name: 'Methylene Blue (AFB)', unit: 'ขวด', category: 'MICRO_BIOLOGY', lowStockThreshold: 5 },
        { name: '10% KOH', unit: 'กล่อง', category: 'MICRO_BIOLOGY', lowStockThreshold: 5 },

        // =====================
        // 7. SUB_STOCKS - คลังย่อยกลุ่มงาน
        // =====================
        { name: 'Hematocrit Reader', unit: 'ชิ้น', category: 'SUB_STOCKS', lowStockThreshold: 2 },
        { name: 'Hct red', unit: 'หลอด', category: 'SUB_STOCKS', lowStockThreshold: 100 },
        { name: 'Hct blue', unit: 'หลอด', category: 'SUB_STOCKS', lowStockThreshold: 100 },
        { name: 'EDTA vac 6 ml', unit: 'หลอด', category: 'SUB_STOCKS', lowStockThreshold: 100 },
        { name: 'EDTA vac 2 ml', unit: 'หลอด', category: 'SUB_STOCKS', lowStockThreshold: 100 },
        { name: 'EDTA K2 0.5 ml', unit: 'หลอด', category: 'SUB_STOCKS', lowStockThreshold: 100 },
        { name: 'Lithium heparin tube 4 ml', unit: 'หลอด', category: 'SUB_STOCKS', lowStockThreshold: 100 },
        { name: 'Lithium tube 3 ml', unit: 'หลอด', category: 'SUB_STOCKS', lowStockThreshold: 100 },
        { name: 'NaF vac', unit: 'หลอด', category: 'SUB_STOCKS', lowStockThreshold: 100 },
        { name: '3.2% Sodium citrate', unit: 'หลอด', category: 'SUB_STOCKS', lowStockThreshold: 100 },
        { name: 'Clot Act Tube 4 ml', unit: 'หลอด', category: 'SUB_STOCKS', lowStockThreshold: 100 },
        { name: 'Slide ใส', unit: 'กล่อง', category: 'SUB_STOCKS', lowStockThreshold: 10 },
        { name: 'Slide ฝ้า', unit: 'กล่อง', category: 'SUB_STOCKS', lowStockThreshold: 10 },
        { name: 'Cover glass', unit: 'กล่อง', category: 'SUB_STOCKS', lowStockThreshold: 10 },
        { name: 'Oil immersion', unit: 'ขวด', category: 'SUB_STOCKS', lowStockThreshold: 10 },
        { name: 'Tube plastic', unit: 'แพ็ค', category: 'SUB_STOCKS', lowStockThreshold: 5, description: '1000Tube' },
        { name: 'Cap tube', unit: 'แพ็ค', category: 'SUB_STOCKS', lowStockThreshold: 5, description: '1000Cap' },
        { name: 'ดินน้ำมัน', unit: 'ชิ้น', category: 'SUB_STOCKS', lowStockThreshold: 10 },
        { name: 'Blue tip', unit: 'แพ็ค', category: 'SUB_STOCKS', lowStockThreshold: 5, description: '1000อัน' },
        { name: 'Yellow tip', unit: 'แพ็ค', category: 'SUB_STOCKS', lowStockThreshold: 5, description: '1000อัน' },
        { name: 'Microtube 2ml with O-ring screw cap', unit: 'กล่อง', category: 'SUB_STOCKS', lowStockThreshold: 10 },
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
    console.log('\n📦 Product Categories:');
    console.log('   - CHEMICAL_CLINIC: เคมีคลินิก (15 items)');
    console.log('   - IMMUNOLOGY: ภูมิคุ้มกันวิทยา (30 items)');
    console.log('   - HEMATOLOGY: โลหิตวิทยา (13 items)');
    console.log('   - MICROSCOPIC: จุลทรรศนศาสตร์ (8 items)');
    console.log('   - BLOOD_BANK: ธนาคารเลือด (4 items)');
    console.log('   - MICRO_BIOLOGY: จุลชีววิทยา (34 items)');
    console.log('   - SUB_STOCKS: คลังย่อยกลุ่มงาน (21 items)');
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
