/**
 * BIE Interactive Socratic Game Engine
 * Evaluates empirical interactions in 3D WebGL scientific simulations.
 * Students test their intuition by manipulating parameters to reach physical targets.
 */

const GAME_CHALLENGES = {
  crispr_precision_cleave: {
    id: 'crispr_precision_cleave',
    domain: 'biology_crispr_dna',
    title: 'CRISPR Target Cleavage Calibration',
    objective: 'Adjust PAM affinity and endonuclease cleavage rate to cleanly excise a mutant viral sequence without causing off-target damage.',
    targetCriteria: {
      cleavage_rate_min: 40,
      cleavage_rate_max: 75,
      pam_affinity_min: 0.8,
      pam_affinity_max: 1.4
    },
    defaultParams: { cleavage_rate: 20, pam_affinity: 0.4 },
    misconceptionTrap: {
      condition: (p) => p.cleavage_rate > 85 && p.pam_affinity < 0.6,
      feedback: 'Off-target catastrophe! Setting cleavage high without tight PAM binding causes Cas9 to shear random healthy genomic DNA.'
    },
    successMessage: 'Target Acquired! Cas9 hybridized with exact 20-bp specificity and cleanly cleaved the viral genome.'
  },

  water_ice_transition: {
    id: 'water_ice_transition',
    domain: 'chemistry_molecular_orbitals',
    title: 'Ice Crystal Density Anomaly',
    objective: 'Cool liquid water to freezing point while maintaining dipole cohesion to form an open hexagonal crystal lattice.',
    targetCriteria: {
      temperature_kelvin_min: 265,
      temperature_kelvin_max: 273,
      dipole_strength_min: 0.6,
      dipole_strength_max: 0.95
    },
    defaultParams: { temperature_kelvin: 320, dipole_strength: 0.5 },
    misconceptionTrap: {
      condition: (p) => p.temperature_kelvin < 260 && p.dipole_strength < 0.4,
      feedback: 'Without sufficient electrostatic dipole strength, thermal contraction produces an amorphous collapse rather than buoyant ice.'
    },
    successMessage: 'Hexagonal Crystal Lattice Formed! Empty interstitial cavities expand the structure, proving why ice floats on water.'
  },

  black_hole_isco_orbit: {
    id: 'black_hole_isco_orbit',
    domain: 'astrophysics_black_hole',
    title: 'Innermost Stable Circular Orbit (ISCO)',
    objective: 'Tune black hole spin and mass to stabilize relativistic accretion plasma precisely at the ISCO boundary without falling past the event horizon.',
    targetCriteria: {
      black_hole_mass_min: 8,
      black_hole_mass_max: 15,
      accretion_spin_min: 0.75,
      accretion_spin_max: 0.95
    },
    defaultParams: { black_hole_mass: 4, accretion_spin: 0.3 },
    misconceptionTrap: {
      condition: (p) => p.accretion_spin > 0.99,
      feedback: 'Naked Singularity Warning! Kerr spin cannot exceed 1.0 (Cosmic Censorship Conjecture).'
    },
    successMessage: 'Stable Keplerian Orbit Achieved! Relativistic Doppler blueshifting glows on the approaching disk sector.'
  },

  lorentz_cyclotron_resonance: {
    id: 'lorentz_cyclotron_resonance',
    domain: 'electromagnetism_cyclotron',
    title: 'Cyclotron Resonance Steering',
    objective: 'Align magnetic field B_z to steer the high-energy ion into the particle detector target while verifying that kinetic energy remains invariant.',
    targetCriteria: {
      magnetic_field_b_min: 1.8,
      magnetic_field_b_max: 2.6,
      particle_velocity_min: 4.5,
      particle_velocity_max: 6.0
    },
    defaultParams: { magnetic_field_b: 0.5, particle_velocity: 2.0 },
    misconceptionTrap: {
      condition: (p) => p.magnetic_field_b > 4.0 && p.particle_velocity < 2.0,
      feedback: 'Over-confinement! Magnetic gyro-radius collapsed before reaching detector. Remember, B-field changes curvature, not speed.'
    },
    successMessage: 'Direct Target Hit! The gyro-radius precisely matched the target aperture with exactly zero magnetic work done on the particle.'
  },

  synaptic_vesicle_release: {
    id: 'synaptic_vesicle_release',
    domain: 'neuroscience_synapse',
    title: 'Quantal Synaptic Transmission',
    objective: 'Trigger sufficient calcium influx to assemble the SNARE complex and release neurotransmitter quanta across the 20nm synaptic cleft.',
    targetCriteria: {
      calcium_influx_min: 50,
      calcium_influx_max: 85,
      action_potential_freq_min: 30,
      action_potential_freq_max: 60
    },
    defaultParams: { calcium_influx: 15, action_potential_freq: 10 },
    misconceptionTrap: {
      condition: (p) => p.calcium_influx < 30,
      feedback: 'Failure to cross! Action potential arrived at the presynaptic terminal, but without Ca2+ influx, vesicle exocytosis is completely blocked.'
    },
    successMessage: 'Synaptic Transmission Successful! Post-synaptic membrane depolarized above threshold via quantal packet diffusion.'
  },

  subduction_magma_arc: {
    id: 'subduction_magma_arc',
    domain: 'geophysics_plate_tectonics',
    title: 'Mantle Wedge Flux Melting',
    objective: 'Drive oceanic lithosphere dewatering into the asthenosphere mantle wedge to induce flux melting and ignite an island arc volcano.',
    targetCriteria: {
      subduction_speed_min: 5.0,
      subduction_speed_max: 8.5,
      slab_water_content_min: 55,
      slab_water_content_max: 85
    },
    defaultParams: { subduction_speed: 2.0, slab_water_content: 20 },
    misconceptionTrap: {
      condition: (p) => p.slab_water_content < 35,
      feedback: 'Dry slab failure! Solid mantle peridotite will not melt purely from sliding friction. Seawater dehydration is required for flux melting.'
    },
    successMessage: 'Island Arc Volcano Ignited! Volatiles lowered the mantle solidus temperature, initiating buoyant magma ascent.'
  }
};

class InteractiveGameEngine {
  constructor() {
    this.challenges = GAME_CHALLENGES;
    this.playerState = {
      score: 0,
      completedChallenges: [],
      attemptLog: []
    };
  }

  getChallenge(challengeId) {
    return this.challenges[challengeId] || null;
  }

  listChallenges() {
    return Object.values(this.challenges).map(c => ({
      id: c.id,
      domain: c.domain,
      title: c.title,
      objective: c.objective,
      defaultParams: c.defaultParams
    }));
  }

  evaluateAttempt(challengeId, submittedParams) {
    const challenge = this.challenges[challengeId];
    if (!challenge) {
      return { success: false, message: `Challenge ${challengeId} not found.` };
    }

    // Check for misconception traps
    if (challenge.misconceptionTrap && challenge.misconceptionTrap.condition(submittedParams)) {
      this.playerState.attemptLog.push({ challengeId, submittedParams, status: 'TRAP' });
      return {
        success: false,
        status: 'MISCONCEPTION_TRIGGERED',
        feedback: challenge.misconceptionTrap.feedback,
        penalty: 10
      };
    }

    // Evaluate target criteria
    let criteriaMet = true;
    const target = challenge.targetCriteria;
    for (const [key, value] of Object.entries(submittedParams)) {
      const minKey = `${key}_min`;
      const maxKey = `${key}_max`;
      if (target[minKey] !== undefined && value < target[minKey]) criteriaMet = false;
      if (target[maxKey] !== undefined && value > target[maxKey]) criteriaMet = false;
    }

    if (criteriaMet) {
      if (!this.playerState.completedChallenges.includes(challengeId)) {
        this.playerState.completedChallenges.push(challengeId);
        this.playerState.score += 100;
      }
      this.playerState.attemptLog.push({ challengeId, submittedParams, status: 'SUCCESS' });
      return {
        success: true,
        status: 'PASSED',
        feedback: challenge.successMessage,
        scoreEarned: 100,
        totalScore: this.playerState.score
      };
    }

    this.playerState.attemptLog.push({ challengeId, submittedParams, status: 'FAILED' });
    return {
      success: false,
      status: 'NEAR_TARGET',
      feedback: 'Parameters are outside equilibrium range. Refine your calibration sliders based on the scientific law.',
      submittedParams
    };
  }
}

module.exports = {
  GAME_CHALLENGES,
  InteractiveGameEngine
};
