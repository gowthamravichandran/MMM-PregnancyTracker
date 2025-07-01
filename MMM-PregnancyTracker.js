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
    
    // Create header with week information
    const header = document.createElement("div");
    header.className = "pregnancy-header";
    header.innerHTML = `
      <h2>Week ${this.pregnancyData.currentWeek}</h2>
      <p class="due-date">Due Date: ${this.pregnancyData.dueDate}</p>
      ${this.config.showDaysRemaining ? `<p class="days-remaining">${this.pregnancyData.daysRemaining} days remaining</p>` : ''}
    `;
    wrapper.appendChild(header);
    
    // Calculate progress percentage (used for both progress bars)
    const progressPercentage = Math.min((this.pregnancyData.currentWeek / 40) * 100, 100);
    
    // Add original progress bar (hidden via CSS but kept for compatibility)
    const progressContainer = document.createElement("div");
    progressContainer.className = "pregnancy-progress";
    
    const progressBar = document.createElement("div");
    progressBar.className = "pregnancy-progress-bar";
    progressBar.style.width = `${progressPercentage}%`;
    
    progressContainer.appendChild(progressBar);
    wrapper.appendChild(progressContainer);
    
    // Create content container
    const content = document.createElement("div");
    content.className = "pregnancy-content";
    
    // Add fetus image with circular progress
    const imageContainer = document.createElement("div");
    imageContainer.className = "fetus-image";
    
    // Create circular progress container
    const circularProgress = document.createElement("div");
    circularProgress.className = "circular-progress";
    
    // Create SVG for circular progress
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", "progress-ring");
    svg.setAttribute("viewBox", "0 0 100 100");
    
    // Add gradient definition
    const defs = document.createElementNS(svgNS, "defs");
    const linearGradient = document.createElementNS(svgNS, "linearGradient");
    linearGradient.setAttribute("id", "progressGradient");
    linearGradient.setAttribute("x1", "0%");
    linearGradient.setAttribute("y1", "0%");
    linearGradient.setAttribute("x2", "100%");
    linearGradient.setAttribute("y2", "0%");
    
    const stop1 = document.createElementNS(svgNS, "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", "rgba(255, 255, 255, 0.5)");
    
    const stop2 = document.createElementNS(svgNS, "stop");
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("stop-color", "rgba(255, 255, 255, 0.9)");
    
    linearGradient.appendChild(stop1);
    linearGradient.appendChild(stop2);
    defs.appendChild(linearGradient);
    svg.appendChild(defs);
    
    // Calculate circle parameters
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    
    // Background circle
    const circleBg = document.createElementNS(svgNS, "circle");
    circleBg.setAttribute("class", "progress-ring-circle-bg");
    circleBg.setAttribute("cx", "50");
    circleBg.setAttribute("cy", "50");
    circleBg.setAttribute("r", radius);
    
    // Progress circle
    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("class", "progress-ring-circle");
    circle.setAttribute("cx", "50");
    circle.setAttribute("cy", "50");
    circle.setAttribute("r", radius);
    circle.setAttribute("stroke-dasharray", circumference);
    
    // Calculate offset for circular progress
    const offset = circumference - (progressPercentage / 100) * circumference;
    circle.setAttribute("stroke-dashoffset", offset);
    
    svg.appendChild(circleBg);
    svg.appendChild(circle);
    circularProgress.appendChild(svg);
    
    // Create inner image container
    const innerImageContainer = document.createElement("div");
    innerImageContainer.className = "image-container";
    
    // Add image
    if (this.pregnancyData.imageUrl) {
      const image = document.createElement("img");
      image.src = this.pregnancyData.imageUrl;
      image.alt = `Fetus at week ${this.pregnancyData.currentWeek}`;
      innerImageContainer.appendChild(image);
    } else {
      innerImageContainer.innerHTML = "Loading image...";
    }
    
    // Add inner image container to circular progress
    circularProgress.appendChild(innerImageContainer);
    imageContainer.appendChild(circularProgress);
    content.appendChild(imageContainer);
    
    // Add information section
    const infoSection = document.createElement("div");
    infoSection.className = "pregnancy-info";
    
    // Add size comparison if enabled
    if (this.config.showSizeComparison && this.pregnancyData.sizeComparison) {
      const sizeComparison = document.createElement("div");
      sizeComparison.className = "size-comparison";
      sizeComparison.innerHTML = `
        <h3>Size Comparison</h3>
        <p>${this.pregnancyData.sizeComparison}</p>
      `;
      infoSection.appendChild(sizeComparison);
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
      infoSection.appendChild(milestones);
    }
    
    content.appendChild(infoSection);
    wrapper.appendChild(content);
    
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
