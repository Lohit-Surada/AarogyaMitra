package com.aarogyamitra.backend.config;

import com.aarogyamitra.backend.model.Product;
import com.aarogyamitra.backend.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner seedPharmacyProducts(ProductRepository productRepository) {
        return args -> {
            if (productRepository.count() > 0) {
                return; // Already seeded
            }

            List<Product> products = Arrays.asList(
                // ---- MEDICINES ----
                new Product(null,
                    "Paracetamol 500mg (Strip of 15)",
                    "Widely used to relieve mild to moderate pain and reduce fever. Safe for all ages when used as directed.",
                    25.0, "Medicines", 500,
                    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
                    4.7, 3280, "Reduces fever, headache & body ache", "Rare: skin rash, liver issues at overdose",
                    "Sun Pharma", true),

                new Product(null,
                    "Azithromycin 500mg (3 Tablets)",
                    "Antibiotic prescribed for bacterial infections including respiratory tract, skin and soft tissue infections.",
                    89.5, "Medicines", 200,
                    "https://images.unsplash.com/photo-1550572017-edd951b55104?w=400",
                    4.5, 1120, "Bacterial infections, pneumonia, sinusitis", "Nausea, vomiting, diarrhoea",
                    "Cipla", true),

                new Product(null,
                    "Cetirizine 10mg (10 Tablets)",
                    "Antihistamine for relief from allergic rhinitis, urticaria and other allergy symptoms.",
                    35.0, "Medicines", 800,
                    "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=400",
                    4.6, 2100, "Sneezing, runny nose, itchy eyes & skin", "Drowsiness, dry mouth",
                    "Dr. Reddy's Labs", true),

                new Product(null,
                    "Metformin 500mg (30 Tablets)",
                    "First-line medication for treatment of type 2 diabetes, lowers blood glucose levels.",
                    62.0, "Medicines", 350,
                    "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400",
                    4.4, 890, "Type 2 Diabetes management", "GI upset, metallic taste (rare: lactic acidosis)",
                    "Lupin Limited", true),

                new Product(null,
                    "Omeprazole 20mg (14 Capsules)",
                    "Proton pump inhibitor used to treat acid reflux, GERD and stomach ulcers.",
                    78.0, "Medicines", 420,
                    "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400",
                    4.8, 1540, "Acid reflux, GERD, gastric ulcers", "Headache, diarrhoea (usually mild)",
                    "Torrent Pharma", true),

                new Product(null,
                    "Ibuprofen 400mg (10 Tablets)",
                    "NSAID that relieves pain, reduces inflammation, and brings down fever.",
                    30.0, "Medicines", 600,
                    "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400",
                    4.5, 1780, "Pain, inflammation, fever", "GI upset, avoid on empty stomach",
                    "Abbott India", true),

                // ---- HEALTH SUPPLEMENTS ----
                new Product(null,
                    "Vitamin D3 + K2 (60 Softgels)",
                    "Premium combination for bone density, immunity, and cardiovascular health.",
                    599.0, "Health Supplements", 180,
                    "https://images.unsplash.com/photo-1607619662634-3ac55ec0e216?w=400",
                    4.8, 2340, "Bone health, immune support, heart health", "Excessive dosage may cause hypercalcemia",
                    "HealthKart", true),

                new Product(null,
                    "Omega-3 Fish Oil 1000mg (60 Capsules)",
                    "High-potency omega-3 supplement for heart health, brain function and joint mobility.",
                    449.0, "Health Supplements", 250,
                    "https://images.unsplash.com/photo-1622020457014-f56f3f809534?w=400",
                    4.7, 3100, "Heart health, brain function, joints", "Fishy aftertaste, mild stomach upset",
                    "Himalaya Wellness", true),

                new Product(null,
                    "Biotin 10000mcg (60 Tablets)",
                    "High-strength biotin for healthy hair growth, nail strength and skin vitality.",
                    349.0, "Health Supplements", 320,
                    "https://images.unsplash.com/photo-1563213126-a4273aed2016?w=400",
                    4.6, 4200, "Hair growth, nail strength, skin health", "Rare: acne breakouts at high doses",
                    "GNC India", true),

                new Product(null,
                    "Whey Protein Isolate Vanilla (1kg)",
                    "Fast-absorbing protein powder for muscle recovery and lean muscle growth.",
                    1899.0, "Health Supplements", 90,
                    "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400",
                    4.9, 5600, "Muscle recovery, lean mass, post-workout", "Excess may cause bloating",
                    "MuscleBlaze", true),

                new Product(null,
                    "Multivitamin Complete (30 Tablets)",
                    "Daily multivitamin with 23 essential vitamins and minerals for overall wellness.",
                    299.0, "Health Supplements", 450,
                    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
                    4.5, 1890, "Overall health, energy, immunity", "Nausea if taken on empty stomach",
                    "Wellman", true),

                new Product(null,
                    "Ashwagandha KSM-66 (60 Capsules)",
                    "Certified KSM-66 Ashwagandha for stress relief, cortisol management and energy.",
                    399.0, "Health Supplements", 280,
                    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
                    4.7, 2700, "Stress relief, energy, hormonal balance", "Rare: mild GI discomfort",
                    "OZiva", true),

                // ---- PERSONAL CARE ----
                new Product(null,
                    "Niacinamide 10% Face Serum (30ml)",
                    "Brightening serum with niacinamide to reduce pores, even skin tone and control sebum.",
                    499.0, "Personal Care", 380,
                    "https://images.unsplash.com/photo-1601612628452-9e99ced43524?w=400",
                    4.7, 6100, "Pore reduction, brightening, sebum control", "May cause mild flushing initially",
                    "Minimalist", true),

                new Product(null,
                    "SPF 50 Sunscreen Gel (50g)",
                    "Lightweight, non-greasy broad-spectrum UVA/UVB sunscreen for daily outdoor protection.",
                    345.0, "Personal Care", 500,
                    "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400",
                    4.6, 3450, "UV protection, anti-tanning, moisturizing", "Rarely causes contact allergy",
                    "Mamaearth", true),

                new Product(null,
                    "Anti-Dandruff Shampoo (200ml)",
                    "Medicated shampoo with Ketoconazole 2% for effective dandruff treatment.",
                    220.0, "Personal Care", 300,
                    "https://images.unsplash.com/photo-1617897903246-719242758050?w=400",
                    4.4, 1890, "Dandruff removal, scalp health", "Avoid eyes; may dry scalp with overuse",
                    "Cipla Health", true),

                new Product(null,
                    "Moisturising Body Lotion (400ml)",
                    "Deep hydration body lotion with shea butter and hyaluronic acid for 24-hour moisture lock.",
                    299.0, "Personal Care", 420,
                    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400",
                    4.5, 2200, "Deep moisturization, skin softening", "None known for normal skin",
                    "Nivea India", true),

                new Product(null,
                    "Micellar Cleansing Water (200ml)",
                    "Gentle makeup remover and facial cleanser, no-rinse formula for sensitive skin.",
                    350.0, "Personal Care", 260,
                    "https://images.unsplash.com/photo-1567721913486-6585f069b332?w=400",
                    4.6, 1600, "Makeup removal, gentle cleansing", "Not for rinse-free use around eyes with sensitivity",
                    "Garnier India", true),

                // ---- MEDICAL DEVICES ----
                new Product(null,
                    "Digital Blood Pressure Monitor",
                    "Clinically validated automatic upper arm BP monitor with irregular heartbeat detection.",
                    1299.0, "Medical Devices", 75,
                    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400",
                    4.8, 1890, "Home BP monitoring, arrhythmia detection", "Not a substitute for medical diagnosis",
                    "Omron Healthcare", true),

                new Product(null,
                    "Pulse Oximeter Fingertip",
                    "Accurate SpO2 and pulse rate measurement, ideal for home health monitoring.",
                    699.0, "Medical Devices", 150,
                    "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400",
                    4.7, 3400, "Blood oxygen monitoring, pulse rate", "Not medical grade for ICU use",
                    "Dr. Trust", true),

                new Product(null,
                    "Digital Thermometer (Flexible Tip)",
                    "Fast 10-second reading thermometer with fever alert and memory recall.",
                    199.0, "Medical Devices", 300,
                    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
                    4.5, 2100, "Fever detection, temperature monitoring", "For external use only",
                    "Braun India", true),

                new Product(null,
                    "Glucometer with 25 Test Strips",
                    "Compact blood glucose monitor with 5-second results and large backlit display.",
                    849.0, "Medical Devices", 110,
                    "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400",
                    4.6, 1450, "Diabetes blood sugar monitoring", "Requires finger-prick blood sample",
                    "Accu-Chek", true),

                new Product(null,
                    "Nebulizer Machine (Compressor Type)",
                    "Effective respiratory therapy device for asthma, COPD and bronchitis treatment.",
                    2499.0, "Medical Devices", 40,
                    "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400",
                    4.8, 980, "Asthma, COPD, respiratory conditions", "Not for dry powder inhaler medicines",
                    "Philips Healthcare", true),

                // ---- BABY CARE ----
                new Product(null,
                    "Baby Diaper Rash Cream (100g)",
                    "Zinc oxide based cream providing instant relief and overnight protection for diaper rash.",
                    185.0, "Baby Care", 420,
                    "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400",
                    4.8, 2800, "Diaper rash prevention, skin barrier", "Avoid broken skin wounds",
                    "Himalaya Baby", true),

                new Product(null,
                    "Baby Massage Oil (200ml)",
                    "Ayurvedic blend of almond, olive and coconut oils for gentle baby massage.",
                    220.0, "Baby Care", 380,
                    "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400",
                    4.7, 1900, "Bone & muscle development, skin nourishment", "Test patch for sensitive baby skin",
                    "Johnson's Baby", true),

                new Product(null,
                    "Baby Vitamin D3 Drops (15ml)",
                    "Oral vitamin D3 drops formulated for infants and toddlers to support bone growth.",
                    299.0, "Baby Care", 200,
                    "https://images.unsplash.com/photo-1607619662634-3ac55ec0e216?w=400",
                    4.9, 1100, "Bone health, rickets prevention", "Follow prescribed dosage strictly",
                    "Wellbaby", true),

                new Product(null,
                    "Baby Oral Rehydration Salt Sachets",
                    "WHO-formulated ORS solution for rapid rehydration during diarrhoea in infants.",
                    60.0, "Baby Care", 600,
                    "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400",
                    4.6, 750, "Rehydration after diarrhoea/vomiting", "Not for severe dehydration without doctor",
                    "Pedialyte India", true),

                // ---- FITNESS ----
                new Product(null,
                    "Creatine Monohydrate (250g)",
                    "Pharmaceutical-grade creatine for explosive power, strength gains and faster recovery.",
                    799.0, "Fitness", 160,
                    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
                    4.8, 4300, "Strength, power output, muscle recovery", "Drink extra water; may cause water retention",
                    "BigMuscles Nutrition", true),

                new Product(null,
                    "Electrolyte Sports Drink Mix (400g)",
                    "Rapid hydration formula with sodium, potassium and magnesium for endurance athletes.",
                    499.0, "Fitness", 200,
                    "https://images.unsplash.com/photo-1576866209830-589e1bfbaa4d?w=400",
                    4.5, 1800, "Hydration, electrolyte balance, stamina", "High sodium; not for kidney patients",
                    "GU Energy", true),

                new Product(null,
                    "BCAA 2:1:1 Powder (400g) - Tropical",
                    "Branched-chain amino acids to prevent muscle breakdown during intense training.",
                    899.0, "Fitness", 130,
                    "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400",
                    4.6, 2400, "Muscle preservation, recovery, endurance", "Excessive use may affect insulin sensitivity",
                    "Optimum Nutrition", true),

                new Product(null,
                    "Fat Burner Thermogenic Capsules (60)",
                    "Green tea extract, CLA and L-Carnitine blend to support fat metabolism and energy.",
                    749.0, "Fitness", 95,
                    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
                    4.3, 1100, "Fat metabolism, energy boost, thermogenesis", "Avoid if caffeine-sensitive; not for under-18",
                    "MusclePharm", true),

                new Product(null,
                    "Pre-Workout Powder Berry Blast (250g)",
                    "Clinically dosed pre-workout with beta-alanine, citrulline and caffeine for peak performance.",
                    1099.0, "Fitness", 70,
                    "https://images.unsplash.com/photo-1549476464-37392f717541?w=400",
                    4.7, 3200, "Energy, focus, endurance, pump", "May cause tingling sensation (beta-alanine flush)",
                    "C4 India", true)
            );

            productRepository.saveAll(products);
            System.out.println("✅ AarogyaMitra Pharmacy: Seeded " + products.size() + " products successfully!");
        };
    }
}
