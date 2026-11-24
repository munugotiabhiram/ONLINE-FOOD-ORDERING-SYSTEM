const categories = [
  {
    name: 'Pizza',
    slug: 'pizza',
    icon_3d: '🍕',
    description: 'Artisanal wood-fired sourdough pizzas with bubbling mozzarella and fresh toppings',
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    display_order: 1
  },
  {
    name: 'Burgers',
    slug: 'burgers',
    icon_3d: '🍔',
    description: 'Juicy gourmet smashed patties, artisanal brioche buns, and melted cheddar',
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    display_order: 2
  },
  {
    name: 'Biryani',
    slug: 'biryani',
    icon_3d: '🍲',
    description: 'Fragrant dum cooked long-grain basmati rice with exotic royal spices and tender meat',
    image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
    display_order: 3
  },
  {
    name: 'Chinese',
    slug: 'chinese',
    icon_3d: '🥡',
    description: 'Wok-tossed noodles, fiery schezwan delicacies, dim sums, and crispy appetizers',
    image_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80',
    display_order: 4
  },
  {
    name: 'South Indian',
    slug: 'south-indian',
    icon_3d: '🥞',
    description: 'Golden crispy dosas, fluffy steamed idlis, spicy sambar, and fresh coconut chutneys',
    image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80',
    display_order: 5
  },
  {
    name: 'North Indian',
    slug: 'north-indian',
    icon_3d: '🍛',
    description: 'Rich creamy butter chicken, paneer tikka, smoked dal makhani, and warm garlic naan',
    image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
    display_order: 6
  },
  {
    name: 'Desserts',
    slug: 'desserts',
    icon_3d: '🍰',
    description: 'Decadent lava cakes, handcrafted pastries, artisanal gelato, and traditional sweets',
    image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
    display_order: 7
  },
  {
    name: 'Beverages',
    slug: 'beverages',
    icon_3d: '🍹',
    description: 'Refreshing fruit mocktails, signature iced coffees, milkshakes, and organic teas',
    image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
    display_order: 8
  },
  {
    name: 'Fast Food',
    slug: 'fast-food',
    icon_3d: '🍟',
    description: 'Golden peri-peri fries, crunchy chicken wraps, hot wings, and cheesy bites',
    image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80',
    display_order: 9
  }
];

// Fix beverages image
categories[7].image_url = 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80';

const restaurants = [
  {
    name: 'The 3D Crust Pizzeria',
    cuisine: 'Italian, Wood-Fired Pizza',
    rating: 4.8,
    delivery_time: '25-35 mins',
    min_order: 12.00,
    banner_url: 'https://images.unsplash.com/photo-1579684947550-22e945225d9a?auto=format&fit=crop&w=800&q=80',
    logo_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=200&q=80',
    address: '88 Little Italy Street, Downtown',
    is_trending: 1
  },
  {
    name: 'Royal Biryani Darbar',
    cuisine: 'Hyderabadi, Mughlai, Indian',
    rating: 4.9,
    delivery_time: '30-40 mins',
    min_order: 15.00,
    banner_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    logo_url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=200&q=80',
    address: '14 Palace Grand Way, Midtown',
    is_trending: 1
  },
  {
    name: 'Smash & Stack Burger Co.',
    cuisine: 'American, Gourmet Burgers',
    rating: 4.7,
    delivery_time: '20-30 mins',
    min_order: 10.00,
    banner_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
    logo_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&q=80',
    address: '22 Broadway Avenue, West District',
    is_trending: 1
  },
  {
    name: 'Dragon Wok Express',
    cuisine: 'Chinese, Asian Fusion',
    rating: 4.6,
    delivery_time: '25-35 mins',
    min_order: 12.00,
    banner_url: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80',
    logo_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=200&q=80',
    address: '105 Chinatown Plaza, East Side',
    is_trending: 1
  },
  {
    name: 'Spice Symphony Kitchen',
    cuisine: 'North & South Indian Traditional',
    rating: 4.8,
    delivery_time: '30-45 mins',
    min_order: 14.00,
    banner_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
    logo_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=200&q=80',
    address: '74 Curry Spice Blvd, Old City',
    is_trending: 1
  },
  {
    name: 'Sweet Dreams Patisserie',
    cuisine: 'Desserts, French Bakery & Shakes',
    rating: 4.9,
    delivery_time: '15-25 mins',
    min_order: 8.00,
    banner_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    logo_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=200&q=80',
    address: '19 Baker Street, Sweet Corner',
    is_trending: 1
  }
];

const foodItems = [
  // 1. Pizza (category_id: 1)
  {
    category_slug: 'pizza',
    restaurant_index: 0,
    name: 'Truffle & Wild Mushroom Pizza',
    description: 'Black truffle cream base, roasted wild portobello mushrooms, fior di latte mozzarella, and fresh thyme.',
    price: 18.99,
    rating: 4.9,
    reviews_count: 240,
    prep_time: '20-25 min',
    is_veg: 1,
    is_featured: 1,
    is_recommended: 1,
    is_available: 1,
    badge: 'Chef Special',
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80'
  },
  {
    category_slug: 'pizza',
    restaurant_index: 0,
    name: 'Spicy Pepperoni Diablo Pizza',
    description: 'Crispy artisan pepperoni cups, hot Calabrian chili honey drizzle, San Marzano tomato sauce, and smoked provolone.',
    price: 17.49,
    rating: 4.8,
    reviews_count: 310,
    prep_time: '15-20 min',
    is_veg: 0,
    is_featured: 1,
    is_recommended: 1,
    is_available: 1,
    badge: 'Bestseller',
    image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80'
  },
  {
    category_slug: 'pizza',
    restaurant_index: 0,
    name: 'Classic Margherita Supreme',
    description: 'Buffalo mozzarella, heirloom tomatoes, fresh Genovese basil leaves, and cold-pressed extra virgin olive oil.',
    price: 14.99,
    rating: 4.7,
    reviews_count: 185,
    prep_time: '15-20 min',
    is_veg: 1,
    is_featured: 0,
    is_recommended: 1,
    is_available: 1,
    badge: 'Classic',
    image_url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80'
  },
  {
    category_slug: 'pizza',
    restaurant_index: 0,
    name: 'BBQ Smoked Chicken Pizza',
    description: 'Tender pulled chicken, smoky hickory barbecue sauce, red onion rings, fresh cilantro, and gouda cheese.',
    price: 18.25,
    rating: 4.8,
    reviews_count: 142,
    prep_time: '20-25 min',
    is_veg: 0,
    is_featured: 0,
    is_recommended: 0,
    is_available: 1,
    badge: 'Popular',
    image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80'
  },

  // 2. Burgers (category_id: 2)
  {
    category_slug: 'burgers',
    restaurant_index: 2,
    name: 'The 3D Monster Smash Burger',
    description: 'Double Angus beef smashed patties, triple American cheese, crispy caramelized bacon, secret umami sauce on toasted brioche.',
    price: 15.99,
    rating: 4.9,
    reviews_count: 420,
    prep_time: '15-20 min',
    is_veg: 0,
    is_featured: 1,
    is_recommended: 1,
    is_available: 1,
    badge: 'Signature 3D',
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80'
  },
  {
    category_slug: 'burgers',
    restaurant_index: 2,
    name: 'Crispy Nashville Hot Chicken Burger',
    description: 'Buttermilk fried chicken breast dunked in Nashville cayenne oil, creamy slaw, and kosher pickles.',
    price: 14.49,
    rating: 4.8,
    reviews_count: 280,
    prep_time: '15-18 min',
    is_veg: 0,
    is_featured: 1,
    is_recommended: 1,
    is_available: 1,
    badge: 'Hot & Spicy',
    image_url: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80'
  },
  {
    category_slug: 'burgers',
    restaurant_index: 2,
    name: 'Truffle Swiss Mushroom Veggie Burger',
    description: 'Grilled portobello and quinoa patty, melted aged Swiss, sautéed wild mushrooms, and black truffle garlic aioli.',
    price: 13.99,
    rating: 4.6,
    reviews_count: 110,
    prep_time: '15-20 min',
    is_veg: 1,
    is_featured: 0,
    is_recommended: 1,
    is_available: 1,
    badge: 'Gourmet Veg',
    image_url: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=600&q=80'
  },

  // 3. Biryani (category_id: 3)
  {
    category_slug: 'biryani',
    restaurant_index: 1,
    name: 'Royal Hyderabadi Mutton Dum Biryani',
    description: 'Slow-cooked tender baby mutton pieces infused with saffron, mint, fried onions, and aged royal basmati rice with mirchi ka salan.',
    price: 19.99,
    rating: 4.9,
    reviews_count: 530,
    prep_time: '25-30 min',
    is_veg: 0,
    is_featured: 1,
    is_recommended: 1,
    is_available: 1,
    badge: 'Royal Special',
    image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80'
  },
  {
    category_slug: 'biryani',
    restaurant_index: 1,
    name: 'Nawabi Chicken Dum Biryani',
    description: 'Succulent chicken thighs marinated in yogurt, shahi garam masala, layered with fragrant saffron rice and boiled egg.',
    price: 16.99,
    rating: 4.8,
    reviews_count: 390,
    prep_time: '20-25 min',
    is_veg: 0,
    is_featured: 1,
    is_recommended: 1,
    is_available: 1,
    badge: 'Bestseller',
    image_url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80'
  },
  {
    category_slug: 'biryani',
    restaurant_index: 1,
    name: 'Awadhi Shahi Paneer Dum Biryani',
    description: 'Cubes of fresh malai paneer, baby potatoes, green peas, and cashews braised in saffron rose water and aromatic spices.',
    price: 14.99,
    rating: 4.7,
    reviews_count: 175,
    prep_time: '20-25 min',
    is_veg: 1,
    is_featured: 0,
    is_recommended: 1,
    is_available: 1,
    badge: 'Vegetarian Feast',
    image_url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80'
  },

  // 4. Chinese (category_id: 4)
  {
    category_slug: 'chinese',
    restaurant_index: 3,
    name: 'Dragon Chili Garlic Hakka Noodles',
    description: 'Thin egg noodles tossed in smoking wok with crunchy bell peppers, garlic scallions, and fiery red chili paste.',
    price: 12.99,
    rating: 4.7,
    reviews_count: 215,
    prep_time: '15-20 min',
    is_veg: 1,
    is_featured: 1,
    is_recommended: 1,
    is_available: 1,
    badge: 'Wok Master',
    image_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80'
  },
  {
    category_slug: 'chinese',
    restaurant_index: 3,
    name: 'Crispy Kung Pao Chicken',
    description: 'Diced chicken tossed with toasted crunchy peanuts, dried red chilies, scallions, and Sichuan soy glaze.',
    price: 15.49,
    rating: 4.8,
    reviews_count: 190,
    prep_time: '15-20 min',
    is_veg: 0,
    is_featured: 0,
    is_recommended: 1,
    is_available: 1,
    badge: 'Chef Choice',
    image_url: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=600&q=80'
  },
  {
    category_slug: 'chinese',
    restaurant_index: 3,
    name: 'Steamed Crystal Dim Sums (6 Pcs)',
    description: 'Delicate translucent dumplings filled with water chestnuts, shiitake mushrooms, and garlic chives served with chili dip.',
    price: 11.99,
    rating: 4.8,
    reviews_count: 160,
    prep_time: '12-15 min',
    is_veg: 1,
    is_featured: 0,
    is_recommended: 0,
    is_available: 1,
    badge: 'Handcrafted',
    image_url: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=600&q=80'
  },

  // 5. South Indian (category_id: 5)
  {
    category_slug: 'south-indian',
    restaurant_index: 4,
    name: 'Mysore Masala Butter Dosa',
    description: 'Golden paper-thin fermented rice crepe brushed with spiced red chili garlic chutney and filled with potato masala.',
    price: 10.99,
    rating: 4.9,
    reviews_count: 310,
    prep_time: '12-15 min',
    is_veg: 1,
    is_featured: 1,
    is_recommended: 1,
    is_available: 1,
    badge: 'South Special',
    image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80'
  },
  {
    category_slug: 'south-indian',
    restaurant_index: 4,
    name: 'Steamed Ghee Podi Idlis (4 Pcs)',
    description: 'Pillow-soft fermented rice cakes drenched in pure organic desi ghee and sprinkled with spicy gun powder (karam podi).',
    price: 8.99,
    rating: 4.8,
    reviews_count: 180,
    prep_time: '10-12 min',
    is_veg: 1,
    is_featured: 0,
    is_recommended: 1,
    is_available: 1,
    badge: 'Bestseller',
    image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80'
  },

  // 6. North Indian (category_id: 6)
  {
    category_slug: 'north-indian',
    restaurant_index: 4,
    name: 'Smoked Butter Chicken & Garlic Naan',
    description: 'Tandoor-charred chicken simmered in velvet satin tomato sauce with fenugreek and butter, paired with garlic naan.',
    price: 17.99,
    rating: 4.9,
    reviews_count: 480,
    prep_time: '20-25 min',
    is_veg: 0,
    is_featured: 1,
    is_recommended: 1,
    is_available: 1,
    badge: 'Popular',
    image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80'
  },
  {
    category_slug: 'north-indian',
    restaurant_index: 4,
    name: 'Dal Makhani Bukhara Style',
    description: 'Whole black lentils slow cooked overnight over charcoal embers with rich dairy cream, butter, and mild spices.',
    price: 13.99,
    rating: 4.8,
    reviews_count: 220,
    prep_time: '15-20 min',
    is_veg: 1,
    is_featured: 0,
    is_recommended: 1,
    is_available: 1,
    badge: 'Heritage Dish',
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80'
  },

  // 7. Desserts (category_id: 7)
  {
    category_slug: 'desserts',
    restaurant_index: 5,
    name: '3D Molten Chocolate Lava Cake',
    description: 'Warm rich Belgian dark chocolate sponge cake with an oozing liquid ganache center, served with vanilla bean ice cream.',
    price: 8.99,
    rating: 4.9,
    reviews_count: 360,
    prep_time: '10-15 min',
    is_veg: 1,
    is_featured: 1,
    is_recommended: 1,
    is_available: 1,
    badge: 'Decadent',
    image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80'
  },
  {
    category_slug: 'desserts',
    restaurant_index: 5,
    name: 'Artisanal Red Velvet Cheesecake',
    description: 'Classic crimson cocoa cake layered with New York style cream cheese frosting on buttery graham cracker crust.',
    price: 7.99,
    rating: 4.8,
    reviews_count: 195,
    prep_time: '10 min',
    is_veg: 1,
    is_featured: 0,
    is_recommended: 1,
    is_available: 1,
    badge: 'Sweet Tooth',
    image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80'
  },

  // 8. Beverages (category_id: 8)
  {
    category_slug: 'beverages',
    restaurant_index: 5,
    name: 'Sparkling Passion Fruit Dragon Mocktail',
    description: 'Fresh passion fruit pulp, crushed dragon fruit, mint leaves, lime juice, and effervescent sparkling tonic.',
    price: 6.49,
    rating: 4.7,
    reviews_count: 140,
    prep_time: '5-8 min',
    is_veg: 1,
    is_featured: 1,
    is_recommended: 1,
    is_available: 1,
    badge: 'Refreshing',
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80'
  },
  {
    category_slug: 'beverages',
    restaurant_index: 5,
    name: 'Iced Spanish Caramel Latte',
    description: 'Double shot espresso shaken over crystal ice with condensed milk, whole milk, and salted caramel ribbon.',
    price: 5.99,
    rating: 4.8,
    reviews_count: 220,
    prep_time: '5-7 min',
    is_veg: 1,
    is_featured: 0,
    is_recommended: 1,
    is_available: 1,
    badge: 'Caffeine Rush',
    image_url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80'
  },

  // 9. Fast Food (category_id: 9)
  {
    category_slug: 'fast-food',
    restaurant_index: 2,
    name: 'Loaded 3D Cheesy Truffle Fries',
    description: 'Golden crispy skin-on fries smothered in hot cheddar cheese sauce, white truffle oil, bacon crumbles, and chives.',
    price: 7.99,
    rating: 4.8,
    reviews_count: 290,
    prep_time: '10-12 min',
    is_veg: 0,
    is_featured: 1,
    is_recommended: 1,
    is_available: 1,
    badge: 'Crowd Favorite',
    image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80'
  },
  {
    category_slug: 'fast-food',
    restaurant_index: 2,
    name: 'Crispy Mozzarella Sticks with Marinara (6 Pcs)',
    description: 'Herb breaded mozzarella batons fried to golden perfection with stringy cheese pull and tangy marinara sauce.',
    price: 8.49,
    rating: 4.7,
    reviews_count: 175,
    prep_time: '8-10 min',
    is_veg: 1,
    is_featured: 0,
    is_recommended: 1,
    is_available: 1,
    badge: 'Cheesy',
    image_url: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?auto=format&fit=crop&w=600&q=80'
  }
];

const coupons = [
  {
    code: 'WELCOME50',
    discount_percent: 50,
    max_discount: 12.00,
    min_order_amount: 20.00,
    description: '50% OFF up to $12.00 on orders above $20.00'
  },
  {
    code: 'TASTY30',
    discount_percent: 30,
    max_discount: 15.00,
    min_order_amount: 25.00,
    description: '30% OFF up to $15.00 on orders above $25.00'
  },
  {
    code: 'FREEDEL',
    discount_percent: 15,
    max_discount: 5.00,
    min_order_amount: 15.00,
    description: 'Special delivery discount: Flat 15% OFF'
  },
  {
    code: 'FEAST20',
    discount_percent: 20,
    max_discount: 10.00,
    min_order_amount: 18.00,
    description: '20% OFF up to $10.00 on all favorite dishes'
  }
];

module.exports = {
  categories,
  restaurants,
  foodItems,
  coupons
};
