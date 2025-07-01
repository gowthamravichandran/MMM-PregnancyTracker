const NodeHelper = require("node_helper");
const path = require("path");
const fs = require("fs");
const Log = require("logger");

module.exports = NodeHelper.create({
  // Initialize variables
  pregnancyData: null,

  // Initialize the module
  start: function() {
    Log.log(`Starting node helper for: ${this.name}`);
    this.loadPregnancyData();
  },

  // Load pregnancy data from JSON files
  loadPregnancyData: function() {
    try {
      // Load developmental milestones data
      const milestonesPath = path.resolve(__dirname, "data/milestones.json");
      const sizeComparisonsPath = path.resolve(__dirname, "data/size_comparisons.json");
      
      if (fs.existsSync(milestonesPath) && fs.existsSync(sizeComparisonsPath)) {
        const milestones = JSON.parse(fs.readFileSync(milestonesPath, "utf8"));
        const sizeComparisons = JSON.parse(fs.readFileSync(sizeComparisonsPath, "utf8"));
        
        this.pregnancyData = {
          milestones: milestones,
          sizeComparisons: sizeComparisons
        };
        
        Log.log("Pregnancy data loaded successfully");
      } else {
        Log.error("Pregnancy data files not found. Please ensure data/milestones.json and data/size_comparisons.json exist.");
        // Create the data structure with placeholder data
        this.createPlaceholderData();
      }
    } catch (error) {
      Log.error("Error loading pregnancy data:", error);
      // Create the data structure with placeholder data
      this.createPlaceholderData();
    }
  },

  // Create placeholder data if files don't exist
  createPlaceholderData: function() {
    Log.log("Creating placeholder pregnancy data");
    
    // Create basic data structure
    this.pregnancyData = {
      milestones: {},
      sizeComparisons: {}
    };
    
    // Add placeholder data for each week
    for (let week = 1; week <= 40; week++) {
      this.pregnancyData.milestones[week] = [
        "Developmental data not available. Please create data files."
      ];
      
      this.pregnancyData.sizeComparisons[week] = 
        `Week ${week}: Size comparison not available. Please create data files.`;
    }
    
    // Create data directory if it doesn't exist
    const dataDir = path.resolve(__dirname, "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Write placeholder data to files
    fs.writeFileSync(
      path.resolve(dataDir, "milestones.json"), 
      JSON.stringify(this.pregnancyData.milestones, null, 2)
    );
    
    fs.writeFileSync(
      path.resolve(dataDir, "size_comparisons.json"), 
      JSON.stringify(this.pregnancyData.sizeComparisons, null, 2)
    );
    
    Log.log("Placeholder data files created. Please update with actual pregnancy data.");
  },

  // Get image URL for a specific week
  getImageUrl: function(week) {
    const weekNum = parseInt(week);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 41) {
      return null;
    }
    
    // Check if image exists
    const imagePath = `/modules/MMM-PregnancyTracker/images/week${weekNum}.png`;
    const fullImagePath = path.resolve(__dirname, `images/week${weekNum}.png`);
    
    if (fs.existsSync(fullImagePath)) {
      return imagePath;
    } else {
      // If we don't have an image for this specific week, try to find the closest available week
      let closestWeek = null;
      let minDiff = 41; // Maximum possible difference
      
      for (let i = 1; i <= 41; i++) {
        const testPath = path.resolve(__dirname, `images/week${i}.png`);
        if (fs.existsSync(testPath)) {
          const diff = Math.abs(i - weekNum);
          if (diff < minDiff) {
            minDiff = diff;
            closestWeek = i;
          }
        }
      }
      
      if (closestWeek !== null) {
        return `/modules/MMM-PregnancyTracker/images/week${closestWeek}.png`;
      }
      
      // If no week images are found at all, return null
      return null;
    }
  },

  // Handle socket notifications from the module
  socketNotificationReceived: function(notification, payload) {
    if (notification === "GET_PREGNANCY_DATA") {
      const week = payload.week;
      
      // Ensure pregnancy data is loaded
      if (!this.pregnancyData) {
        this.loadPregnancyData();
      }
      
      // Get data for the requested week
      const weekData = {
        sizeComparison: this.pregnancyData.sizeComparisons[week] || `Week ${week}: Size comparison not available`,
        developmentalMilestones: this.pregnancyData.milestones[week] || [`Week ${week}: Developmental data not available`],
        imageUrl: this.getImageUrl(week)
      };
      
      // Send data back to the module
      this.sendSocketNotification("PREGNANCY_DATA", weekData);
    }
  }
});
