// backend/data/masterDietData.js

const dietTemplates = {
  highProtein: {
    name: "High Protein Diet",
    dailyGoals: { calorieTarget: 2200, proteinTarget: 120, carbsTarget: 250, fatTarget: 60, fiberTarget: 35 },
    avoidables: "Fried foods, Excess sweets",
    sessions: [
      { sessionName: "Early Morning", time: "6:00 AM", items: [
        { name: "Health mix porridge/gruel with milk / in milk", quantity: "1 bowl/glass" },
        { name: "10 soaked almonds (skin removed and ground) - boil together, strain, and serve.", quantity: "1 serving" }
      ]},
      { sessionName: "Breakfast", time: "8:00 AM", items: [
        { name: "Whole grain food", quantity: "1 portion" },
        { name: "Sambar", quantity: "1 bowl" },
        { name: "Chutney (Mint / Coriander / Garlic / Vegetable)", quantity: "2 tbsp" },
        { name: "Boiled egg white (Daily)", quantity: "1 egg" }
      ]},
      { sessionName: "Mid-Morning", time: "10:00 AM", items: [
        { name: "Milk / Lassi / Tomato / Spinach / Vegetable / Dal Soup", quantity: "1 glass/bowl" },
        { name: "Snacks", quantity: "1 portion" },
        { name: "Fruits (Pomegranate, Orange, Sweet lime, Banana)", quantity: "1 bowl" }
      ]},
      { sessionName: "Lunch", time: "12:30 – 1:00 PM", items: [
        { name: "Rice / Chapathi", quantity: "1 portion" },
        { name: "Dal / Sambar", quantity: "1 bowl" },
        { name: "Spinach varieties", quantity: "1 cup" },
        { name: "Vegetables", quantity: "1 cup" },
        { name: "Rasam", quantity: "1/2 cup" },
        { name: "Curd", quantity: "1/2 cup" },
        { name: "Fish / Chicken", quantity: "1 portion" },
        { name: "Egg (Daily)", quantity: "1 egg" },
        { name: "Fruits", quantity: "1 portion" }
      ]},
      { sessionName: "Evening", time: "4:00 PM", items: [
        { name: "Green tea / Milk", quantity: "1 cup" },
        { name: "Snacks", quantity: "1 portion" }
      ]},
      { sessionName: "Dinner", time: "7:30 PM", items: [
        { name: "Same as Breakfast", quantity: "1 portion" },
        { name: "Vegetables", quantity: "1 cup" },
        { name: "Fruits", quantity: "1 portion" }
      ]},
      { sessionName: "Night", time: "9:00 PM", items: [
        { name: "Milk", quantity: "1 glass" }
      ]}
    ]
  },

  liquidDiet: {
    name: "Liquid Diet",
    dailyGoals: { calorieTarget: 1500, proteinTarget: 60, carbsTarget: 200, fatTarget: 30, fiberTarget: 10 },
    avoidables: "Solid foods, Raw vegetables, Thick meats",
    sessions: [
      { sessionName: "Early Morning", time: "6:00 AM", items: [
        { name: "Peanut milk", quantity: "1 glass" }
      ]},
      { sessionName: "Breakfast", time: "8:00 AM", items: [
        { name: "Health mix porridge", quantity: "1 glass" }
      ]},
      { sessionName: "Mid-Morning", time: "10:00 AM", items: [
        { name: "Egg blend", quantity: "1 glass" }
      ]},
      { sessionName: "Lunch", time: "12:30 – 1:00 PM", items: [
        { name: "Health mix porridge", quantity: "1 bowl" }
      ]},
      { sessionName: "Mid-Afternoon", time: "2:00 PM", items: [
        { name: "Paneer blend", quantity: "1 glass" }
      ]},
      { sessionName: "Evening", time: "4:00 PM", items: [
        { name: "Egg blend", quantity: "1 glass" }
      ]},
      { sessionName: "Evening 2", time: "6:00 PM", items: [
        { name: "Paneer blend", quantity: "1 glass" }
      ]},
      { sessionName: "Night", time: "8:00 PM", items: [
        { name: "Health mix porridge", quantity: "1 glass" }
      ]},
      { sessionName: "Late Night", time: "9:00 PM", items: [
        { name: "Almond milk", quantity: "1 glass" }
      ]}
    ]
  },

  rylesTube: {
    name: "Ryles Tube / Jejunostomy",
    dailyGoals: { calorieTarget: 1800, proteinTarget: 80, carbsTarget: 220, fatTarget: 40, fiberTarget: 15 },
    avoidables: "Solid foods, Unstrained liquids",
    sessions: [
      { sessionName: "Early Morning", time: "6:00 AM", items: [
        { name: "Almond milk", quantity: "1 feed" }
      ]},
      { sessionName: "Breakfast", time: "8:00 AM", items: [
        { name: "Health mix porridge / HIGH CALORIE CEREAL MIX-HCCM", quantity: "1 feed" }
      ]},
      { sessionName: "Mid-Morning", time: "10:00 AM", items: [
        { name: "Egg blend", quantity: "1 feed" }
      ]},
      { sessionName: "Lunch", time: "12:30 – 1:00 PM", items: [
        { name: "Health mix porridge / HIGH CALORIE CEREAL MIX-HCCM", quantity: "1 feed" }
      ]},
      { sessionName: "Mid-Afternoon", time: "2:00 PM", items: [
        { name: "Paneer blend", quantity: "1 feed" }
      ]},
      { sessionName: "Evening", time: "4:00 PM", items: [
        { name: "Egg blend", quantity: "1 feed" }
      ]},
      { sessionName: "Evening 2", time: "6:00 PM", items: [
        { name: "Paneer blend", quantity: "1 feed" }
      ]},
      { sessionName: "Night", time: "8:00 PM", items: [
        { name: "Health mix porridge / HIGH CALORIE CEREAL MIX-HCCM", quantity: "1 feed" }
      ]},
      { sessionName: "Late Night", time: "9:00 PM", items: [
        { name: "Almond milk", quantity: "1 feed" }
      ]}
    ]
  },

  mixieMashed: {
    name: "Mixie Mashed Diet",
    dailyGoals: { calorieTarget: 2000, proteinTarget: 100, carbsTarget: 240, fatTarget: 50, fiberTarget: 25 },
    avoidables: "Hard solid foods, Nuts, Raw vegetables",
    sessions: [
      { sessionName: "Early Morning", time: "6:00 AM", items: [
        { name: "Health mix porridge/gruel with milk / in milk", quantity: "1 bowl" },
        { name: "10 soaked almonds (skin removed and ground) - boil together, strain, and serve.", quantity: "1 serving" }
      ]},
      { sessionName: "Breakfast", time: "8:00 AM", items: [
        { name: "Blended/Mashed Idli and Sambar", quantity: "1 bowl" },
        { name: "Blended/Mashed Pongal and Sambar", quantity: "1 bowl" },
        { name: "Blended/Mashed Upma and Sambar", quantity: "1 bowl" }
      ]},
      { sessionName: "Mid-Morning", time: "10:00 AM", items: [
        { name: "Milk / Lassi / Tomato / Spinach / Vegetable / Dal Soup", quantity: "1 glass/bowl" },
        { name: "Blended/Mashed Vegetables or Fruits – Banana, Papaya, Boiled Apple", quantity: "1 cup" }
      ]},
      { sessionName: "Lunch", time: "12:30 – 1:00 PM", items: [
        { name: "Blended/Mashed Sambar Rice", quantity: "1 bowl" },
        { name: "Blended/Mashed Rasam Rice", quantity: "1 bowl" },
        { name: "Blended/Mashed Curd Rice", quantity: "1 bowl" },
        { name: "Blended/Mashed Kootu (Vegetable-dal stew)", quantity: "1 bowl" }
      ]},
      { sessionName: "Mid-Afternoon", time: "2:00 PM", items: [
        { name: "Boiled and Blended/Mashed Carrot, Sweet Potato", quantity: "1 cup" }
      ]},
      { sessionName: "Evening", time: "4:00 PM", items: [
        { name: "Milk / Lassi / Tomato / Spinach / Vegetable / Dal Soup", quantity: "1 glass/bowl" }
      ]},
      { sessionName: "Dinner", time: "7:30 PM", items: [
        { name: "Blended/Mashed Idli and Sambar", quantity: "1 bowl" },
        { name: "Blended/Mashed Pongal and Sambar", quantity: "1 bowl" },
        { name: "Blended/Mashed Upma and Sambar", quantity: "1 bowl" }
      ]},
      { sessionName: "Night", time: "9:00 PM", items: [
        { name: "Almond milk", quantity: "1 glass" }
      ]}
    ]
  }
};

module.exports = dietTemplates;