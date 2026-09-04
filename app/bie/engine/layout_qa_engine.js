/**
 * BIE Layout QA & Zero-Collision Staging Solver
 * 
 * Guarantee: Zero visual overlap across all video layers:
 * [Header Banner, 3D WebGL Simulation Viewport, Empirical Laboratory Clip, Formula Card, Subtitle HUD]
 * 
 * Uses 2D Axis-Aligned Bounding Box (AABB) + Time Interval Arithmetic:
 * Overlap occurs if and only if:
 * (X1_min < X2_max && X1_max > X2_min) &&
 * (Y1_min < Y2_max && Y1_max > Y2_min) &&
 * (T1_start < T2_end && T1_end > T2_start)
 */

class LayoutQAEngine {
  constructor(viewportWidth = 1920, viewportHeight = 1080) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.minMarginPx = 16; // Minimum guaranteed padding between elements
  }

  /**
   * Normalizes bounding boxes [x1, y1, x2, y2] to absolute pixel coordinates
   */
  toPixels(box) {
    return {
      x1: box[0] * this.viewportWidth,
      y1: box[1] * this.viewportHeight,
      x2: box[2] * this.viewportWidth,
      y2: box[3] * this.viewportHeight,
      w: (box[2] - box[0]) * this.viewportWidth,
      h: (box[3] - box[1]) * this.viewportHeight
    };
  }

  /**
   * Evaluates AABB intersection with minimum margin padding
   */
  checkIntersection(boxA, boxB) {
    const a = this.toPixels(boxA);
    const b = this.toPixels(boxB);

    const overlapX = (a.x1 < b.x2 + this.minMarginPx) && (a.x2 + this.minMarginPx > b.x1);
    const overlapY = (a.y1 < b.y2 + this.minMarginPx) && (a.y2 + this.minMarginPx > b.y1);

    if (overlapX && overlapY) {
      const intersectionWidth = Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1));
      const intersectionHeight = Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1));
      return {
        intersect: true,
        overlapAreaPx: intersectionWidth * intersectionHeight
      };
    }

    return { intersect: false, overlapAreaPx: 0 };
  }

  /**
   * Runs an audit over a scene specification containing visual elements
   */
  auditSceneLayout(elements = []) {
    const collisions = [];
    let totalOverlapArea = 0;

    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const elemA = elements[i];
        const elemB = elements[j];

        // Check if both elements are active on screen simultaneously
        const timeOverlap = !(elemA.endFrame <= elemB.startFrame || elemA.startFrame >= elemB.endFrame);

        if (timeOverlap) {
          const check = this.checkIntersection(elemA.boundingBox, elemB.boundingBox);
          if (check.intersect) {
            collisions.push({
              elementA: elemA.id,
              elementB: elemB.id,
              overlapAreaPx: check.overlapAreaPx,
              timeWindow: [Math.max(elemA.startFrame || 0, elemB.startFrame || 0), Math.min(elemA.endFrame || 720, elemB.endFrame || 720)]
            });
            totalOverlapArea += check.overlapAreaPx;
          }
        }
      }
    }

    const maxCanvasArea = this.viewportWidth * this.viewportHeight;
    const qualityScore = Math.max(0, Math.min(100, Math.round(100 - (totalOverlapArea / maxCanvasArea * 1000))));

    return {
      passed: collisions.length === 0,
      qualityScore,
      collisionCount: collisions.length,
      collisions,
      totalOverlapAreaPx: totalOverlapArea,
      viewport: { width: this.viewportWidth, height: this.viewportHeight }
    };
  }

  /**
   * Deterministic Auto-Repair Solver:
   * Re-aligns colliding elements into canonical golden-ratio grid with 0 overlap.
   */
  autoRepairLayout(elements = []) {
    const repaired = elements.map(el => ({ ...el, boundingBox: [...el.boundingBox] }));

    // Canonical Grid Slots:
    // Slot 1: Header Top [0.04, 0.04, 0.96, 0.14]
    // Slot 2: Left Main 3D Simulation [0.04, 0.17, 0.50, 0.82]
    // Slot 3: Right Top Lab Clip [0.53, 0.17, 0.96, 0.52]
    // Slot 4: Right Bottom Formula Card [0.53, 0.55, 0.96, 0.82]
    // Slot 5: Bottom Subtitle HUD [0.04, 0.85, 0.96, 0.96]

    repaired.forEach(el => {
      if (el.type === 'header_banner' || el.id.includes('header')) {
        el.boundingBox = [0.04, 0.04, 0.96, 0.14];
      } else if (el.type === 'simulation_pane' || el.id.includes('simulation') || el.id.includes('3d')) {
        el.boundingBox = [0.04, 0.17, 0.50, 0.82];
      } else if (el.type === 'real_video_clip' || el.id.includes('clip')) {
        el.boundingBox = [0.53, 0.17, 0.96, 0.52];
      } else if (el.type === 'formula_card' || el.id.includes('formula')) {
        el.boundingBox = [0.53, 0.55, 0.96, 0.82];
      } else if (el.type === 'subtitle_hud' || el.id.includes('subtitle')) {
        el.boundingBox = [0.04, 0.85, 0.96, 0.96];
      }
    });

    const auditAfter = this.auditSceneLayout(repaired);

    return {
      repairedElements: repaired,
      audit: auditAfter,
      solved: auditAfter.passed
    };
  }
}

module.exports = {
  LayoutQAEngine
};
