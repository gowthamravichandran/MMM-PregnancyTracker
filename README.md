# MMM-PregnancyTracker

A [MagicMirror²](https://github.com/MichMich/MagicMirror) module that tracks pregnancy progress and displays fetus images based on the current week of pregnancy.

![Example of MMM-PregnancyTracker](./images/example.png)

## Features

- Displays the current week of pregnancy
- Shows fetus development images for each week
- Provides developmental milestones for the current week
- Shows size comparison (e.g., "Your baby is the size of a lemon")
- Displays days remaining until due date
- Calculates dates based on conception date or Last Menstrual Period (LMP)
- Modern, clean design

## Installation

1. Navigate to your MagicMirror's modules folder:
```bash
cd ~/MagicMirror/modules
```

2. Clone this repository:
```bash
git clone https://github.com/yourusername/MMM-PregnancyTracker.git
```

3. Add the module to your `config/config.js` file:
```javascript
{
  module: 'MMM-PregnancyTracker',
  position: 'middle_center',
  config: {
    // See configuration options below
    conceptionDate: "2025-01-15" // Format: YYYY-MM-DD
  }
}
```

## Configuration Options

| Option | Description | Type | Default |
| ------ | ----------- | ---- | ------- |
| `conceptionDate` | Date of conception (Format: YYYY-MM-DD) | String | `null` |
| `lmpDate` | Date of Last Menstrual Period (Format: YYYY-MM-DD) | String | `null` |
| `updateInterval` | How often to update the display (in milliseconds) | Number | `86400000` (1 day) |
| `showDaysRemaining` | Whether to show days remaining until due date | Boolean | `true` |
| `showSizeComparison` | Whether to show size comparison | Boolean | `true` |
| `showDevelopmentalMilestones` | Whether to show developmental milestones | Boolean | `true` |
| `language` | Language for text (for future localization support) | String | `"en"` |

**Note:** You must provide either `conceptionDate` or `lmpDate` for the module to work properly.

## Adding Custom Fetus Images

The module looks for fetus images in the `images` directory. Images should be named according to the week of pregnancy they represent (e.g., `week1.png`, `week2.png`, etc.).

If a specific week's image is not found, the module will display a placeholder image (`placeholder.png`).

See the [images/README.md](./images/README.md) file for more information on adding custom images.

## Customizing Developmental Milestones and Size Comparisons

The module uses data from the following files:

- `data/milestones.json` - Contains developmental milestones for each week
- `data/size_comparisons.json` - Contains size comparisons for each week

You can edit these files to customize the information displayed by the module.

## Updating

To update the module to the latest version:

```bash
cd ~/MagicMirror/modules/MMM-PregnancyTracker
git pull
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
