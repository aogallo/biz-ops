-- =============================================================================
-- POS Demo Data: Categorías y Productos para presentación
-- =============================================================================
-- IMPORTANTE: Reemplazá el valor de ORG_ID con el organization_id real.
-- Para obtenerlo: SELECT id, name FROM organization LIMIT 5;
-- =============================================================================

DO $$
DECLARE
  v_org_id UUID := '';  -- << CAMBIAR ESTO

  -- Categoría IDs
  cat_hamburguesas UUID;
  cat_combos       UUID;
  cat_gaseosas     UUID;
  cat_snacks       UUID;
  cat_postres      UUID;
  cat_sandwiches   UUID;
  cat_ropa         UUID;

BEGIN

  -- ===========================================================================
  -- CATEGORÍAS
  -- ===========================================================================

  INSERT INTO product_category (id, organization_id, name, color, created_at, updated_at)
  VALUES
    (gen_random_uuid(), v_org_id, 'Hamburguesas', 'red',    NOW(), NOW()),
    (gen_random_uuid(), v_org_id, 'Combos',       'orange', NOW(), NOW()),
    (gen_random_uuid(), v_org_id, 'Gaseosas',     'blue',   NOW(), NOW()),
    (gen_random_uuid(), v_org_id, 'Snacks',       'yellow', NOW(), NOW()),
    (gen_random_uuid(), v_org_id, 'Postres',      'pink',   NOW(), NOW()),
    (gen_random_uuid(), v_org_id, 'Sándwiches',   'green',  NOW(), NOW()),
    (gen_random_uuid(), v_org_id, 'Ropa',         'purple', NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Recuperar IDs recién insertados
  SELECT id INTO cat_hamburguesas FROM product_category WHERE organization_id = v_org_id AND name = 'Hamburguesas';
  SELECT id INTO cat_combos       FROM product_category WHERE organization_id = v_org_id AND name = 'Combos';
  SELECT id INTO cat_gaseosas     FROM product_category WHERE organization_id = v_org_id AND name = 'Gaseosas';
  SELECT id INTO cat_snacks       FROM product_category WHERE organization_id = v_org_id AND name = 'Snacks';
  SELECT id INTO cat_postres      FROM product_category WHERE organization_id = v_org_id AND name = 'Postres';
  SELECT id INTO cat_sandwiches   FROM product_category WHERE organization_id = v_org_id AND name = 'Sándwiches';
  SELECT id INTO cat_ropa         FROM product_category WHERE organization_id = v_org_id AND name = 'Ropa';

  -- ===========================================================================
  -- PRODUCTOS: HAMBURGUESAS
  -- ===========================================================================

  INSERT INTO product (organization_id, category_id, sku, name, description, price, stock, min_stock, product_type, image_url, created_at, updated_at)
  VALUES
    (v_org_id, cat_hamburguesas, 'BURG-001', 'Hamburguesa Clásica',
     'Pan brioche, carne 180g, lechuga, tomate, cebolla, pepinillos, ketchup y mostaza',
     850.00, 100, 10, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_hamburguesas, 'BURG-002', 'Hamburguesa Doble',
     'Doble medallón de carne 360g, queso cheddar doble, bacon, salsa especial',
     1250.00, 100, 10, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_hamburguesas, 'BURG-003', 'Hamburguesa BBQ Bacon',
     'Carne 180g, bacon crocante, queso ahumado, cebolla caramelizada, salsa BBQ',
     1100.00, 100, 10, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_hamburguesas, 'BURG-004', 'Hamburguesa Crispy Chicken',
     'Pollo crocante rebozado, coleslaw, pickles, salsa honey mustard',
     980.00, 100, 10, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1562802378-063ec186a863?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_hamburguesas, 'BURG-005', 'Hamburguesa Veggie',
     'Medallón de lentejas y quinoa, aguacate, rúcula, tomate cherry, salsa de yogur',
     900.00, 100, 10, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_hamburguesas, 'BURG-006', 'Hamburguesa Monster',
     'Triple carne 540g, triple queso, bacon doble, huevo frito, jalapeños',
     1650.00, 50, 5, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=200&h=200&fit=crop',
     NOW(), NOW());

  -- ===========================================================================
  -- PRODUCTOS: COMBOS
  -- ===========================================================================

  INSERT INTO product (organization_id, category_id, sku, name, description, price, stock, min_stock, product_type, image_url, created_at, updated_at)
  VALUES
    (v_org_id, cat_combos, 'COMBO-001', 'Combo Clásico',
     'Hamburguesa Clásica + Papas medianas + Gaseosa 350ml',
     1350.00, 999, 5, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_combos, 'COMBO-002', 'Combo Doble Power',
     'Hamburguesa Doble + Papas grandes + Gaseosa 500ml',
     1800.00, 999, 5, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_combos, 'COMBO-003', 'Combo BBQ',
     'Hamburguesa BBQ Bacon + Aros de cebolla + Gaseosa 350ml',
     1600.00, 999, 5, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1550547660-d9450f859349?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_combos, 'COMBO-004', 'Combo Familiar x4',
     '4 Hamburguesas Clásicas + 2 Papas grandes + 4 Gaseosas 350ml',
     4500.00, 999, 2, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_combos, 'COMBO-005', 'Combo Kids',
     'Hamburguesa mini + Papas chicas + Jugo de naranja 250ml',
     850.00, 999, 5, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=200&h=200&fit=crop',
     NOW(), NOW());

  -- ===========================================================================
  -- PRODUCTOS: GASEOSAS
  -- ===========================================================================

  INSERT INTO product (organization_id, category_id, sku, name, description, price, stock, min_stock, product_type, image_url, created_at, updated_at)
  VALUES
    (v_org_id, cat_gaseosas, 'BEV-001', 'Coca-Cola 350ml',
     'Lata de Coca-Cola 350ml bien fría',
     450.00, 200, 20, 'STOCK',
     'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_gaseosas, 'BEV-002', 'Coca-Cola 500ml',
     'Botella de Coca-Cola 500ml',
     600.00, 150, 20, 'STOCK',
     'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_gaseosas, 'BEV-003', 'Sprite 350ml',
     'Lata de Sprite 350ml',
     450.00, 150, 20, 'STOCK',
     'https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_gaseosas, 'BEV-004', 'Fanta Naranja 350ml',
     'Lata de Fanta naranja 350ml',
     450.00, 150, 20, 'STOCK',
     'https://images.unsplash.com/photo-1603569283847-aa295f0d016a?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_gaseosas, 'BEV-005', 'Agua Mineral 500ml',
     'Agua mineral sin gas 500ml',
     300.00, 200, 20, 'STOCK',
     'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_gaseosas, 'BEV-006', 'Agua con Gas 500ml',
     'Agua mineral con gas 500ml',
     320.00, 100, 10, 'STOCK',
     'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_gaseosas, 'BEV-007', 'Jugo de Naranja Natural',
     'Jugo de naranja exprimido al momento 300ml',
     550.00, 50, 5, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_gaseosas, 'BEV-008', 'Cerveza Artesanal Rubia',
     'Cerveza artesanal rubia tipo lager 473ml',
     750.00, 80, 10, 'STOCK',
     'https://images.unsplash.com/photo-1518791841217-8f162f1912da?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_gaseosas, 'BEV-009', 'Limonada',
     'Limonada casera con menta y hielo 400ml',
     480.00, 50, 5, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=200&h=200&fit=crop',
     NOW(), NOW());

  -- ===========================================================================
  -- PRODUCTOS: SNACKS
  -- ===========================================================================

  INSERT INTO product (organization_id, category_id, sku, name, description, price, stock, min_stock, product_type, image_url, created_at, updated_at)
  VALUES
    (v_org_id, cat_snacks, 'SNK-001', 'Papas Fritas Chicas',
     'Papas fritas crocantes porción chica',
     380.00, 999, 10, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_snacks, 'SNK-002', 'Papas Fritas Medianas',
     'Papas fritas crocantes porción mediana',
     480.00, 999, 10, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_snacks, 'SNK-003', 'Papas Fritas Grandes',
     'Papas fritas crocantes porción grande',
     580.00, 999, 10, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1576777647209-e8733d7b851d?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_snacks, 'SNK-004', 'Aros de Cebolla',
     'Aros de cebolla rebozados y fritos, porción 8 unidades',
     520.00, 100, 10, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1639024471283-03518883512d?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_snacks, 'SNK-005', 'Nuggets de Pollo x6',
     '6 nuggets de pollo crocantes con salsa a elección',
     620.00, 100, 10, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_snacks, 'SNK-006', 'Nuggets de Pollo x12',
     '12 nuggets de pollo crocantes con 2 salsas a elección',
     1100.00, 100, 10, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_snacks, 'SNK-007', 'Papas Rústicas',
     'Papas cortadas en gajos con cáscara, condimentadas',
     520.00, 100, 10, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_snacks, 'SNK-008', 'Alitas de Pollo x6',
     '6 alitas de pollo BBQ o picantes',
     750.00, 80, 5, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_snacks, 'SNK-009', 'Mozzarella Sticks x4',
     '4 bastones de mozzarella rebozados con salsa marinara',
     650.00, 80, 5, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=200&h=200&fit=crop',
     NOW(), NOW());

  -- ===========================================================================
  -- PRODUCTOS: POSTRES
  -- ===========================================================================

  INSERT INTO product (organization_id, category_id, sku, name, description, price, stock, min_stock, product_type, image_url, created_at, updated_at)
  VALUES
    (v_org_id, cat_postres, 'DST-001', 'Helado Soft Vainilla',
     'Cono de helado soft de vainilla',
     380.00, 50, 5, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_postres, 'DST-002', 'Helado Soft Chocolate',
     'Cono de helado soft de chocolate',
     380.00, 50, 5, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_postres, 'DST-003', 'Sundae Frutilla',
     'Helado de vainilla con salsa de frutilla y crema',
     520.00, 50, 5, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1557142046-c704a3adf364?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_postres, 'DST-004', 'Brownie con Helado',
     'Brownie de chocolate tibio con helado de vainilla y salsa de caramelo',
     750.00, 30, 3, 'STOCK',
     'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_postres, 'DST-005', 'Milkshake Vainilla',
     'Milkshake cremoso de vainilla 400ml',
     680.00, 30, 5, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_postres, 'DST-006', 'Milkshake Chocolate',
     'Milkshake cremoso de chocolate 400ml',
     680.00, 30, 5, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_postres, 'DST-007', 'Cheesecake de Maracuyá',
     'Porción de cheesecake con coulis de maracuyá',
     650.00, 20, 3, 'STOCK',
     'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=200&h=200&fit=crop',
     NOW(), NOW());

  -- ===========================================================================
  -- PRODUCTOS: SÁNDWICHES
  -- ===========================================================================

  INSERT INTO product (organization_id, category_id, sku, name, description, price, stock, min_stock, product_type, image_url, created_at, updated_at)
  VALUES
    (v_org_id, cat_sandwiches, 'SND-001', 'Club Sándwich',
     'Pan lactal tostado, pollo a la plancha, jamón, queso, lechuga, tomate, mayonesa',
     780.00, 100, 10, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_sandwiches, 'SND-002', 'Sándwich Caprese',
     'Ciabatta, mozzarella fresca, tomate cherry, albahaca, reducción de balsámico',
     720.00, 100, 10, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1481070414801-51fd732d7184?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_sandwiches, 'SND-003', 'Sándwich de Milanesa',
     'Pan árabe, milanesa de ternera, lechuga, tomate, mayonesa y limón',
     850.00, 100, 10, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1603046891744-1f057007e9e7?w=200&h=200&fit=crop',
     NOW(), NOW()),

    (v_org_id, cat_sandwiches, 'SND-004', 'Wrap de Pollo',
     'Tortilla de trigo, pollo a la plancha, mix de verdes, queso rallado, salsa ranch',
     750.00, 100, 10, 'MADE_TO_ORDER',
     'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200&h=200&fit=crop',
     NOW(), NOW());

  -- ===========================================================================
  -- PRODUCTOS: ROPA (con custom attributes: Talla y Color)
  -- ===========================================================================

  INSERT INTO product (organization_id, category_id, sku, name, description, price, stock, min_stock, product_type, image_url, attributes_json, created_at, updated_at)
  VALUES
    (
      v_org_id, cat_ropa, 'ROPA-001', 'Camiseta Premium',
      'Camiseta 100% algodón peinado, corte slim fit, disponible en múltiples tallas y colores',
      250.00, 999, 10, 'STOCK',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop',
      '{
        "attributes": [
          {
            "name": "Talla",
            "key": "size",
            "type": "button",
            "values": [
              { "label": "XS",  "priceAdjustment": 0  },
              { "label": "S",   "priceAdjustment": 0  },
              { "label": "M",   "priceAdjustment": 0  },
              { "label": "L",   "priceAdjustment": 0  },
              { "label": "XL",  "priceAdjustment": 15 },
              { "label": "2XL", "priceAdjustment": 25 },
              { "label": "3XL", "priceAdjustment": 35 }
            ]
          },
          {
            "name": "Color",
            "key": "color",
            "type": "button",
            "values": [
              { "label": "Blanco",     "priceAdjustment": 0  },
              { "label": "Negro",      "priceAdjustment": 0  },
              { "label": "Rojo",       "priceAdjustment": 10 },
              { "label": "Azul Marino","priceAdjustment": 10 },
              { "label": "Verde",      "priceAdjustment": 10 }
            ]
          }
        ]
      }'::jsonb,
      NOW(), NOW()
    ),
    (
      v_org_id, cat_ropa, 'ROPA-002', 'Zapatilla Sport',
      'Zapatilla deportiva con suela de goma y plantilla acolchada, ideal para uso diario',
      850.00, 999, 5, 'STOCK',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop',
      '{
        "attributes": [
          {
            "name": "Talla (EU)",
            "key": "size",
            "type": "button",
            "values": [
              { "label": "35", "priceAdjustment": 0  },
              { "label": "36", "priceAdjustment": 0  },
              { "label": "37", "priceAdjustment": 0  },
              { "label": "38", "priceAdjustment": 0  },
              { "label": "39", "priceAdjustment": 0  },
              { "label": "40", "priceAdjustment": 0  },
              { "label": "41", "priceAdjustment": 50 },
              { "label": "42", "priceAdjustment": 50 },
              { "label": "43", "priceAdjustment": 50 }
            ]
          },
          {
            "name": "Color",
            "key": "color",
            "type": "button",
            "values": [
              { "label": "Blanco", "priceAdjustment": 0  },
              { "label": "Negro",  "priceAdjustment": 0  },
              { "label": "Gris",   "priceAdjustment": 25 },
              { "label": "Rojo",   "priceAdjustment": 50 }
            ]
          }
        ]
      }'::jsonb,
      NOW(), NOW()
    );

  RAISE NOTICE '✅ Seed completado: % categorías y productos cargados para org %', 7, v_org_id;

END $$;
