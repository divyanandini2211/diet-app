const dietTemplates = {
  highProtein: {
    name: "High Protein Diet",
    dailyGoals: { calorieTarget: 2200, proteinTarget: 120, carbsTarget: 250, fatTarget: 60, fiberTarget: 35 },
    avoidables: "Fried foods, Excess sweets",
    sessions: [
      { sessionName: "Early Morning", time: "6:00 AM", items: [
        { name: "Health mix porridge/gruel with milk", quantity: "200 ml" },
        { name: "Soaked almonds (skin removed, ground, boiled)", quantity: "15 g" }
      ]},
      { sessionName: "Breakfast", time: "8:00 AM", items: [
        { name: "Whole grain food (Idli/Dosa/Oats)", quantity: "150 g" },
        { name: "Sambar", quantity: "150 ml" },
        { name: "Chutney (Mint / Coriander / Garlic / Veg)", quantity: "30 g" },
        { name: "Boiled egg white", quantity: "2 eggs" }
      ]},
      { sessionName: "Mid-Morning", time: "10:00 AM", items: [
        { name: "Milk / Lassi / Veg or Dal Soup", quantity: "200 ml" },
        { name: "Fruits (Pomegranate, Orange, Sweet lime, Banana)", quantity: "150 g" }
      ]},
      { sessionName: "Lunch", time: "12:30 PM", items: [
        { name: "Rice / Chapathi", quantity: "150 g" },
        { name: "Dal / Sambar", quantity: "150 ml" },
        { name: "Spinach varieties & Vegetables", quantity: "200 g" },
        { name: "Rasam", quantity: "100 ml" },
        { name: "Curd", quantity: "100 ml" },
        { name: "Fish / Chicken / Egg", quantity: "100 g" }
      ]},
      { sessionName: "Evening", time: "4:00 PM", items: [
        { name: "Green tea / Milk", quantity: "150 ml" },
        { name: "Healthy Snacks", quantity: "50 g" }
      ]},
      { sessionName: "Dinner", time: "7:30 PM", items: [
        { name: "Whole grain food (Idli/Dosa/Oats)", quantity: "150 g" },
        { name: "Sambar", quantity: "150 ml" },
        { name: "Chutney (Mint / Coriander / Garlic / Veg)", quantity: "30 g" },
        { name: "Boiled egg white", quantity: "1 egg" },
        { name: "Vegetables", quantity: "100 g" },
        { name: "Fruits", quantity: "100 g" }
      ]},
      { sessionName: "Night", time: "9:00 PM", items: [
        { name: "Milk", quantity: "150 ml" }
      ]}
    ]
  },

  liquidDiet: {
    name: "Liquid Diet",
    dailyGoals: { calorieTarget: 1500, proteinTarget: 60, carbsTarget: 200, fatTarget: 30, fiberTarget: 10 },
    avoidables: "Solid foods, Raw vegetables, Thick meats",
    sessions: [
      { sessionName: "Early Morning", time: "6:00 AM", items: [{ name: "Peanut milk", quantity: "200 ml" }]},
      { sessionName: "Breakfast", time: "8:00 AM", items: [{ name: "Health mix porridge", quantity: "250 ml" }]},
      { sessionName: "Mid-Morning", time: "10:00 AM", items: [{ name: "Egg blend", quantity: "200 ml" }]},
      { sessionName: "Lunch", time: "12:30 PM", items: [{ name: "Health mix porridge", quantity: "300 ml" }]},
      { sessionName: "Mid-Afternoon", time: "2:00 PM", items: [{ name: "Paneer blend", quantity: "200 ml" }]},
      { sessionName: "Evening", time: "4:00 PM", items: [{ name: "Egg blend", quantity: "200 ml" }]},
      { sessionName: "Evening 2", time: "6:00 PM", items: [{ name: "Paneer blend", quantity: "200 ml" }]},
      { sessionName: "Night", time: "8:00 PM", items: [{ name: "Health mix porridge", quantity: "250 ml" }]},
      { sessionName: "Late Night", time: "9:00 PM", items: [{ name: "Almond milk", quantity: "200 ml" }]}
    ]
  },

  rylesTube: {
    name: "Ryles Tube / Jejunostomy",
    dailyGoals: { calorieTarget: 1800, proteinTarget: 80, carbsTarget: 220, fatTarget: 40, fiberTarget: 15 },
    avoidables: "Solid foods, Unstrained liquids",
    sessions: [
      { sessionName: "Early Morning", time: "6:00 AM", items: [{ name: "Almond milk", quantity: "200 ml" }]},
      { sessionName: "Breakfast", time: "8:00 AM", items: [{ name: "Health mix porridge / HCCM", quantity: "200 ml" }]},
      { sessionName: "Mid-Morning", time: "10:00 AM", items: [{ name: "Egg blend", quantity: "200 ml" }]},
      { sessionName: "Lunch", time: "12:30 PM", items: [{ name: "Health mix porridge / HCCM", quantity: "200 ml" }]},
      { sessionName: "Mid-Afternoon", time: "2:00 PM", items: [{ name: "Paneer blend", quantity: "200 ml" }]},
      { sessionName: "Evening", time: "4:00 PM", items: [{ name: "Egg blend", quantity: "200 ml" }]},
      { sessionName: "Evening 2", time: "6:00 PM", items: [{ name: "Paneer blend", quantity: "200 ml" }]},
      { sessionName: "Night", time: "8:00 PM", items: [{ name: "Health mix porridge / HCCM", quantity: "200 ml" }]},
      { sessionName: "Late Night", time: "9:00 PM", items: [{ name: "Almond milk", quantity: "200 ml" }]}
    ]
  },

  mixieMashed: {
    name: "Mixie Mashed Diet",
    dailyGoals: { calorieTarget: 2000, proteinTarget: 100, carbsTarget: 240, fatTarget: 50, fiberTarget: 25 },
    avoidables: "Hard solid foods, Nuts, Raw vegetables",
    sessions: [
      { sessionName: "Early Morning", time: "6:00 AM", items: [{ name: "Health mix porridge with soaked almond paste", quantity: "200 ml" }]},
      { sessionName: "Breakfast", time: "8:00 AM", items: [{ name: "Blended/Mashed Idli/Pongal/Upma and Sambar", quantity: "250 g" }]},
      { sessionName: "Mid-Morning", time: "10:00 AM", items: [{ name: "Milk / Soup / Blended Fruits", quantity: "200 ml" }]},
      { sessionName: "Lunch", time: "12:30 PM", items: [{ name: "Blended/Mashed Sambar Rice / Rasam Rice / Curd Rice", quantity: "300 g" }]},
      { sessionName: "Mid-Afternoon", time: "2:00 PM", items: [{ name: "Boiled and Mashed Carrot / Sweet Potato", quantity: "150 g" }]},
      { sessionName: "Evening", time: "4:00 PM", items: [{ name: "Milk / Lassi / Soup", quantity: "200 ml" }]},
      { sessionName: "Dinner", time: "7:30 PM", items: [{ name: "Blended/Mashed Idli/Pongal/Upma and Sambar", quantity: "250 g" }]},
      { sessionName: "Night", time: "9:00 PM", items: [{ name: "Almond milk", quantity: "150 ml" }]}
    ]
  }
};

module.exports = dietTemplates;