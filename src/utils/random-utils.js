function getRandomPoint(decimalPlaces = null, canvasWidth = null, canvasHeight = null) {
  const margin = 100;
  const width = canvasWidth || renderTestWidth;
  const height = canvasHeight || renderTestHeight;
  const x = margin + SeededRandom.getRandom() * (width - 2 * margin);
  const y = margin + SeededRandom.getRandom() * (height - 2 * margin);
  
  if (decimalPlaces === null) {
    return { x, y };
  }
  
  return {
    x: Number(x.toFixed(decimalPlaces)),
    y: Number(y.toFixed(decimalPlaces))
  };
}

function getBitsPerChannel(numberOfPartitions) {
  const bitsNeeded = Math.ceil(Math.log2(numberOfPartitions));
  
  // try to spread bits evenly across R, G, B channels
  const bitsPerChannel = [
      Math.floor(bitsNeeded / 3),  // R
      Math.floor(bitsNeeded / 3),  // G
      Math.floor(bitsNeeded / 3)   // B
  ];
  
  const remainingBits = bitsNeeded - (bitsPerChannel[0] + bitsPerChannel[1] + bitsPerChannel[2]);
  for(let i = 0; i < remainingBits; i++) {
      bitsPerChannel[i % 3]++;
  }
  
  return bitsPerChannel;
}

// this function allows for generating random colors with a specific alpha range
// ...AND also allows for partitioning the color space into a number of partitions
// and selecting a specific partition. This is useful for basically generating
// random colors guaranteed to be distinct from each other.
//
// Note that whichPartition is 0-indexed. E.g. if numberOfPartitions is 4, whichPartition
// should be in the range [0, 3].
function getRandomColor(minAlpha = 0, maxAlpha = 255, whichPartition = null, numberOfPartitions = null) {
  // Clamp alpha values to valid range
  minAlpha = Math.max(0, Math.min(255, minAlpha));
  maxAlpha = Math.max(0, Math.min(255, maxAlpha));

  // Ensure minAlpha <= maxAlpha
  if (minAlpha > maxAlpha) {
      [minAlpha, maxAlpha] = [maxAlpha, minAlpha];
  }

  // Generate random alpha value between minAlpha and maxAlpha (inclusive)
  const alpha = Math.floor(minAlpha + SeededRandom.getRandom() * (maxAlpha - minAlpha + 1));

  // If numberOfPartitions is null or whichPartition is null and numberOfPartitions is 1,
  // generate completely random RGB values
  if (numberOfPartitions == null || (whichPartition == null && numberOfPartitions === 1)) {
      return {
          r: Math.floor(SeededRandom.getRandom() * 256),
          g: Math.floor(SeededRandom.getRandom() * 256),
          b: Math.floor(SeededRandom.getRandom() * 256),
          a: alpha
      };
  }

  // Ensure numberOfPartitions is at least 1
  numberOfPartitions = Math.max(1, numberOfPartitions);

  // If whichPartition is null, choose random partition
  if (whichPartition == null) {
      whichPartition = Math.floor(SeededRandom.getRandom() * numberOfPartitions);
  }

  const bitsPerChannel = getBitsPerChannel(numberOfPartitions);
  
  // Validate partition number
  const totalBits = bitsPerChannel.reduce((a, b) => a + b, 0);
  const maxPartition = 1 << totalBits;
  if (whichPartition >= maxPartition) {
      throw new Error(`Partition ${whichPartition} is invalid. Max partition for ${numberOfPartitions} partitions is ${maxPartition - 1}`);
  }
  
  // Extract bits for each channel from the partition number
  let remainingPartitionBits = whichPartition;
  let channels = [0, 0, 0]; // R, G, B
  let bitsRead = 0;
  
  // Place partition bits in the most significant positions of each channel
  for(let i = 2; i >= 0; i--) {
      const mask = (1 << bitsPerChannel[i]) - 1;
      const channelBits = (remainingPartitionBits >> bitsRead) & mask;
      channels[i] = channelBits << (8 - bitsPerChannel[i]);
      bitsRead += bitsPerChannel[i];
  }
  
  // Fill remaining bits with random values
  for(let i = 0; i < 3; i++) {
      const remainingBits = 8 - bitsPerChannel[i];
      const randomBits = Math.floor(SeededRandom.getRandom() * (1 << remainingBits));
      channels[i] |= randomBits;
  }
  
  return {
      r: channels[0],
      g: channels[1],
      b: channels[2],
      a: alpha
  };
}