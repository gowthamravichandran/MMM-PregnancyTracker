Module.register("MMM-PregnancyTracker", {

  defaults: {
    // Either conceptionDate or lmpDate must be provided
    conceptionDate: null, // Format: YYYY-MM-DD
    lmpDate: null, // Format: YYYY-MM-DD (Last Menstrual Period)
    
    // Optional settings
    updateInterval: 86400000, // Update interval in ms (default: once per day)
    header: "Pregnancy Tracker", // Module header text
    showHeader: false, // Whether to show the module header
    showDaysRemaining: true, // Whether to show days remaining
    showSizeComparison: true, // Whether to show size comparison
    showDevelopmentalMilestones: true, // Whether to show developmental milestones
    language: "en" // Language for text (for future localization support)
  },

  // Store pregnancy data
  pregnancyData: {
    currentWeek: 0,
    daysRemaining: 0,
    dueDate: null,
    sizeComparison: "",
    developmentalMilestones: [],
    imageUrl: ""
  },

  /**
   * Apply styles for this module
   */
  getStyles() {
    return ["pregnancytracker.css"]
  },
  
  /**
   * Return the header to display for this module
   */
  getHeader() {
    return this.data.header;
  },

  /**
   * Initialize the module
   */
  start() {
    Log.info(`Starting module: ${this.name}`);
    
    // Validate configuration
    if (!this.config.conceptionDate && !this.config.lmpDate) {
      Log.error("MMM-PregnancyTracker: Either conceptionDate or lmpDate must be provided in the config");
      return;
    }
    
    // Set header visibility based on config
    if (this.config.showHeader) {
      this.data.header = this.config.header;
    } else {
      this.data.header = null;
    }
    
    // Calculate initial pregnancy data
    this.calculatePregnancyData();
    
    // Set up regular updates
    setInterval(() => {
      this.calculatePregnancyData();
      this.updateDom();
    }, this.config.updateInterval);
    
    // Request initial data from node helper
    this.sendSocketNotification("GET_PREGNANCY_DATA", {
      week: this.pregnancyData.currentWeek
    });
  },

  /**
   * Calculate pregnancy data based on conception date or LMP date
   */
  calculatePregnancyData() {
    const today = moment();
    let conceptionDate;
    
    // Calculate conception date
    if (this.config.conceptionDate) {
      conceptionDate = moment(this.config.conceptionDate);
    } else if (this.config.lmpDate) {
      // Estimate conception as 2 weeks after LMP
      conceptionDate = moment(this.config.lmpDate);
    }
    
    // Calculate due date (40 weeks from conception)
    const dueDate = moment(conceptionDate).add(40, 'weeks');
    
    // Calculate current week
    const daysSinceConception = today.diff(conceptionDate, 'days');
    const currentWeek = Math.floor(daysSinceConception / 7) + 1;
    
    // Calculate days remaining
    const daysRemaining = dueDate.diff(today, 'days');
    
    // Update pregnancy data
    this.pregnancyData.currentWeek = Math.min(Math.max(currentWeek, 1), 40); // Clamp between 1-40
    this.pregnancyData.daysRemaining = Math.max(daysRemaining, 0);
    this.pregnancyData.dueDate = dueDate.format('MMMM D, YYYY');
  },

  /**
   * Handle notifications received by the node helper
   *
   * @param {string} notification - The notification identifier
   * @param {any} payload - The payload data returned by the node helper
   */
  socketNotificationReceived(notification, payload) {
    if (notification === "PREGNANCY_DATA") {
      this.pregnancyData.sizeComparison = payload.sizeComparison;
      this.pregnancyData.developmentalMilestones = payload.developmentalMilestones;
      this.pregnancyData.imageUrl = payload.imageUrl;
      this.updateDom();
    }
  },

  /**
   * Render the module's DOM
   */
  getDom() {
    const wrapper = document.createElement("div");
    wrapper.className = "pregnancy-tracker";
    
    // If we're before conception or after birth, show appropriate message
    if (this.pregnancyData.currentWeek < 1) {
      const message = document.createElement("div");
      message.className = "pregnancy-message";
      message.textContent = "Pregnancy hasn't started yet according to the provided dates.";
      wrapper.appendChild(message);
      return wrapper;
    }
    
    if (this.pregnancyData.daysRemaining <= 0) {
      const completeWrapper = document.createElement("div");
      completeWrapper.className = "pregnancy-complete";
      
      const congratsHeader = document.createElement("h2");
      congratsHeader.textContent = "Congratulations!";
      
      const congratsMessage = document.createElement("p");
      congratsMessage.textContent = "Your baby has arrived (or is due any moment).";
      
      completeWrapper.appendChild(congratsHeader);
      completeWrapper.appendChild(congratsMessage);
      wrapper.appendChild(completeWrapper);
      return wrapper;
    }
    
    // Create circular center design
    const circle = document.createElement("div");
    circle.className = "pregnancy-circle";
    
    // Add week number to circle
    const weekNumber = document.createElement("div");
    weekNumber.className = "week-number";
    weekNumber.textContent = this.pregnancyData.currentWeek;
    circle.appendChild(weekNumber);
    
    // Add fetus image to circle
    const fetusContainer = document.createElement("div");
    fetusContainer.className = "fetus-container";
    if (this.pregnancyData.imageUrl) {
      const image = document.createElement("img");
      image.src = this.pregnancyData.imageUrl;
      image.alt = `Fetus at week ${this.pregnancyData.currentWeek}`;
      fetusContainer.appendChild(image);
    } else {
      fetusContainer.innerHTML = "Loading image...";
    }
    circle.appendChild(fetusContainer);
    
    // Add circle to wrapper
    wrapper.appendChild(circle);
    
    // Add due date and days remaining
    const dateInfo = document.createElement("div");
    dateInfo.innerHTML = `
      <p class="due-date">Due Date: ${this.pregnancyData.dueDate}</p>
      ${this.config.showDaysRemaining ? `<p class="days-remaining">${this.pregnancyData.daysRemaining} days remaining</p>` : ''}
    `;
    wrapper.appendChild(dateInfo);
    
    // Add size comparison if enabled
    if (this.config.showSizeComparison && this.pregnancyData.sizeComparison) {
      const sizeComparison = document.createElement("div");
      sizeComparison.className = "size-comparison";
      sizeComparison.innerHTML = `<p>${this.pregnancyData.sizeComparison}</p>`;
      wrapper.appendChild(sizeComparison);
    }
    
    // Add developmental milestones if enabled
    if (this.config.showDevelopmentalMilestones && this.pregnancyData.developmentalMilestones && this.pregnancyData.developmentalMilestones.length > 0) {
      const milestones = document.createElement("div");
      milestones.className = "developmental-milestones";
      milestones.innerHTML = `<h3>Development This Week</h3>`;
      
      const milestoneList = document.createElement("ul");
      this.pregnancyData.developmentalMilestones.forEach(milestone => {
        const item = document.createElement("li");
        item.textContent = milestone;
        milestoneList.appendChild(item);
      });
      
      milestones.appendChild(milestoneList);
      wrapper.appendChild(milestones);
    }
    
    return wrapper;
  },

  /**
   * Request updated pregnancy data from the node helper
   */
  updatePregnancyData() {
    this.sendSocketNotification("GET_PREGNANCY_DATA", {
      week: this.pregnancyData.currentWeek
    });
  },

  /**
   * Handle system notifications
   */
  notificationReceived(notification, payload) {
    if (notification === "MODULE_DOM_CREATED") {
      // Module's DOM has been created, we can now update the data
      this.updatePregnancyData();
    }
  }
})
