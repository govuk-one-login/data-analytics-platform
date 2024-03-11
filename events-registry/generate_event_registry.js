const fs = require('fs');

// Read input JSON from file
const inputFile = 'dataAnalyticsPlatform.json'; // Update with the path to your input JSON file
const sourceData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

// Function to convert source data to destination format
function convertData(sourceData) {
  return sourceData.eventMappings.map(mapping => ({
    event_name: mapping.event_path,
    event_fields: mapping.json_path.map(path => path.destination),
    date_added: "",
    date_modified: "",
    is_retired: "N",
    comments: [""]
  }));
}

// Convert data
const destinationData = convertData(sourceData);

// Write output JSON to file
const outputFile = 'events_registry.json'; // Update with the path where you want to save the output JSON file
fs.writeFileSync(outputFile, JSON.stringify(destinationData, null, 2));
console.log('Output file created successfully:', outputFile);
