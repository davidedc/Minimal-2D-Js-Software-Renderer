// Test filename parser based on the naming convention
class TestNameParser {
  constructor() {
    // Mapping from abbreviations to full names
    this.facetMappings = {
      // Shape
      'line': 'Line',
      'circle': 'Circle', 
      'rect': 'Rectangle',
      'roundrect': 'Rounded Rectangle',
      'arc': 'Arc',
      'scene': 'Scene',
      'mixshape': 'Mixed Shapes',
      
      // Count
      'sgl': 'Single',
      'multi': 'Multiple',
      
      // Size
      'xs': 'Extra Small (5-15px)',
      's': 'Small (16-39px)', 
      'm': 'Medium (40-79px)',
      'l': 'Large (80-159px)',
      'xl': 'Extra Large (160-400px)',
      'szMix': 'Mixed Sizes',
      
      // Fill Style
      'fNone': 'No Fill',
      'fOpaq': 'Opaque Fill',
      'fSemi': 'Semitransparent Fill',
      'fMix': 'Mixed Fill',
      
      // Stroke Style  
      'sNone': 'No Stroke',
      'sOpaq': 'Opaque Stroke',
      'sSemi': 'Semitransparent Stroke',
      'sMix': 'Mixed Stroke',
      
      // Layout
      'lytSpread': 'Spread Layout',
      'lytGrid': 'Grid Layout', 
      'lytRand': 'Random Layout',
      'lytCenter': 'Centered Layout',
      'lytMix': 'Mixed Layout',
      
      // Centered At
      'cenPx': 'Pixel-Centered',
      'cenGrid': 'Grid-Centered',
      'cenMixPG': 'Mixed Pixel/Grid-Centered',
      'cenRand': 'Random-Centered',
      
      // Edge Alignment
      'edgeCrisp': 'Crisp Edges',
      'edgeNotCrisp': 'Non-Crisp Edges',
      'edgeMix': 'Mixed Edge Alignment',
      
      // Orientation
      'ornHoriz': 'Horizontal',
      'ornVert': 'Vertical', 
      'ornAxial': 'Axis-Aligned',
      'ornDeg45': '45-Degree',
      'ornRand': 'Random Orientation',
      'ornMix': 'Mixed Orientation',
      
      // Arc Angle Extent
      'arcADeg90': '90-Degree Arc',
      'arcARand': 'Random Arc Angle',
      'arcAMix': 'Mixed Arc Angles',
      
      // Round Rect Radius
      'rrrLrg': 'Large Radius',
      'rrrRand': 'Random Radius',
      'rrrMix': 'Mixed Radius',
      
      // Context Transformations
      'ctxTransFixed': 'Fixed Translation',
      'ctxTransRand': 'Random Translation',
      'ctxRotFixed': 'Fixed Rotation',
      'ctxRotRand': 'Random Rotation', 
      'ctxScaleFixed': 'Fixed Scaling',
      'ctxScaleRand': 'Random Scaling',
      
      // Clipping
      'clpOnCirc': 'Circle',
      'clpOnArc': 'Arc',
      'clpOnRect': 'Rectangle',
      'clpOnRoundRect': 'Rounded Rectangle',
      'clpCt1': 'Single',
      'clpCtN': 'Multiple',
      'clpArrCenter': 'Centered',
      'clpArrRand': 'Random',
      'clpArrGrid': 'Grid', 
      'clpArrSpread': 'Spread',
      'clpSzXs': 'Extra Small (5-15px)',
      'clpSzS': 'Small (16-39px)',
      'clpSzM': 'Medium (40-79px)',
      'clpSzL': 'Large (80-159px)',
      'clpSzXl': 'Extra Large (160-400px)',
      'clpSzMix': 'Mixed Sizes',
      'clpEdgeCrisp': 'Crisp',
      'clpEdgeNotCrisp': 'Non-Crisp'
    };
    
    // Facet categories in order
    this.facetOrder = [
      'Shape', 'Count', 'Size', 'Fill Style', 'Stroke Style', 'Stroke Thickness',
      'Layout', 'Centered At', 'Edge Alignment', 'Orientation', 'Arc Angle', 
      'Round Rect Radius', 'Context Translation', 'Context Rotation', 'Context Scaling',
      'Clipping'
    ];
  }
  
  parseTestName(filename) {
    // Remove .js extension and split by dashes
    const nameWithoutExt = filename.replace(/\.js$/, '');
    const parts = nameWithoutExt.split('-');
    
    // Remove 'test' from the end
    if (parts[parts.length - 1] === 'test') {
      parts.pop();
    }
    
    const facets = {};
    let i = 0;
    
    // Initialize all facets to N/A first
    facets['Shape'] = 'N/A';
    facets['Count'] = 'N/A';
    facets['Size'] = 'N/A';
    facets['Fill Style'] = 'N/A';
    facets['Stroke Style'] = 'N/A';
    facets['Stroke Thickness'] = 'N/A';
    facets['Layout'] = 'N/A';
    facets['Centered At'] = 'N/A';
    facets['Edge Alignment'] = 'N/A';
    facets['Orientation'] = 'N/A';
    facets['Arc Angle'] = 'N/A';
    facets['Round Rect Radius'] = 'N/A';
    facets['Context Translation'] = 'N/A';
    facets['Context Rotation'] = 'N/A';
    facets['Context Scaling'] = 'N/A';
    facets['Clip Shape'] = 'N/A';
    facets['Clip Count'] = 'N/A';
    facets['Clip Arrangement'] = 'N/A';
    facets['Clip Size'] = 'N/A';
    facets['Clip Edge Alignment'] = 'N/A';
    
    // Parse in expected order
    if (i < parts.length) {
      facets['Shape'] = this.mapValue(parts[i++]);
    }
    
    if (i < parts.length) {
      // Handle count (sgl, multi, m[N])
      const countPart = parts[i++];
      if (countPart.startsWith('m') && /^\d+$/.test(countPart.substring(1))) {
        facets['Count'] = `Multi-${countPart.substring(1)}`;
      } else {
        facets['Count'] = this.mapValue(countPart);
      }
    }
    
    if (i < parts.length) {
      facets['Size'] = this.mapValue(parts[i++]);
    }
    
    if (i < parts.length && parts[i].startsWith('f')) {
      facets['Fill Style'] = this.mapValue(parts[i++]);
    }
    
    if (i < parts.length && parts[i].startsWith('s')) {
      facets['Stroke Style'] = this.mapValue(parts[i++]);
    }
    
    if (i < parts.length && parts[i].startsWith('sw')) {
      const strokePart = parts[i++];
      // Handle stroke thickness (sw1px, sw1-10px, swMix)
      if (strokePart === 'swMix') {
        facets['Stroke Thickness'] = 'Mixed Thickness';
      } else {
        facets['Stroke Thickness'] = strokePart.replace('sw', '') + (strokePart.includes('px') ? '' : ' pixels');
      }
    }
    
    // Parse remaining parts by prefix
    while (i < parts.length) {
      const part = parts[i++];
      
      if (part.startsWith('lyt')) {
        facets['Layout'] = this.mapValue(part);
      } else if (part.startsWith('cen')) {
        facets['Centered At'] = this.mapValue(part);
      } else if (part.startsWith('edge')) {
        facets['Edge Alignment'] = this.mapValue(part);
      } else if (part.startsWith('orn')) {
        facets['Orientation'] = this.mapValue(part);
      } else if (part.startsWith('arcA')) {
        facets['Arc Angle'] = this.mapValue(part);
      } else if (part.startsWith('rrr')) {
        // Handle rrrFix[N] pattern
        if (part.startsWith('rrrFix') && /^\d+$/.test(part.substring(6))) {
          facets['Round Rect Radius'] = `Fixed ${part.substring(6)}px`;
        } else {
          facets['Round Rect Radius'] = this.mapValue(part);
        }
      } else if (part.startsWith('ctxTrans')) {
        facets['Context Translation'] = this.mapValue(part);
      } else if (part.startsWith('ctxRot')) {
        facets['Context Rotation'] = this.mapValue(part);
      } else if (part.startsWith('ctxScale')) {
        facets['Context Scaling'] = this.mapValue(part);
      } else if (part.startsWith('clpOn')) {
        facets['Clip Shape'] = this.mapValue(part);
      } else if (part.startsWith('clpCt')) {
        facets['Clip Count'] = this.mapValue(part);
      } else if (part.startsWith('clpArr')) {
        facets['Clip Arrangement'] = this.mapValue(part);
      } else if (part.startsWith('clpSz')) {
        facets['Clip Size'] = this.mapValue(part);
      } else if (part.startsWith('clpEdge')) {
        facets['Clip Edge Alignment'] = this.mapValue(part);
      }
    }
    
    return facets;
  }
  
  mapValue(value) {
    return this.facetMappings[value] || value;
  }
  
  formatFacets(facets) {
    const themes = {
      'Basic': ['Shape', 'Count', 'Size', 'Orientation'],
      'Fill & Stroke': ['Fill Style', 'Stroke Style', 'Stroke Thickness'],
      'Layout & Position': ['Layout', 'Centered At', 'Edge Alignment'],
      'Shape-Specific': ['Arc Angle', 'Round Rect Radius'],
      'Context Transforms': ['Context Translation', 'Context Rotation', 'Context Scaling'],
      'Clipping': ['Clip Shape', 'Clip Count', 'Clip Arrangement', 'Clip Size', 'Clip Edge Alignment']
    };
    
    let html = '<div class="test-facets" style="margin-top: 10px; font-size: 14px; color: #666; border-top: 1px solid #eee; padding-top: 8px;">';
    html += '<div style="display: flex; flex-wrap: wrap; gap: 15px;">';
    
    for (const [themeName, facetNames] of Object.entries(themes)) {
      // Check if any facets in this theme have non-N/A values
      const hasRelevantFacets = facetNames.some(name => {
        const value = facets[name];
        return value !== 'N/A' && value !== '' && value !== null && value !== undefined;
      });
      
      // Always show all themes, even if all N/A
      html += '<div style="flex: 1; min-width: 140px; margin-bottom: 10px;">';
      html += `<div style="font-weight: bold; color: #444; margin-bottom: 4px; font-size: 16px;">${themeName}</div>`;
      
      for (const facetName of facetNames) {
        const value = facets[facetName];
        if (value !== undefined) {
          const displayValue = Array.isArray(value) ? value.join(', ') : value;
          html += `<div style="margin: 1px 0;"><strong>${facetName}:</strong> ${displayValue}</div>`;
        }
      }
      
      html += '</div>';
    }
    
    html += '</div></div>';
    return html;
  }
} 