/**
 * BIE Universal Domain Simulation Registry
 * Dedicated 3D Model Architectures, Mathematical Physics Scripts & Misconception Engines
 * Across Multi-Disciplinary Scientific Disciplines:
 * - Molecular Biology & Genetics (DNA Double Helix, CRISPR-Cas9)
 * - Organic & Physical Chemistry (Benzene Resonance, Water Dipole Hydrogen Bonds)
 * - Astrophysics & General Relativity (Schwarzschild Black Hole, Accretion Disk, Gravitational Lensing)
 * - Electromagnetism & Particle Physics (Lorentz Cyclotron, Coulomb 3D Vector Fields)
 * - Neuroscience & Biophysics (Synaptic Cleft, Vesicle Exocytosis, Ion Channels)
 * - Planetary Geophysics (Subduction Dynamics, Mantle Convection, Lithospheric Rifting)
 */

const DOMAIN_REGISTRY = {
  biology_crispr_dna: {
    domainId: 'biology_crispr_dna',
    title: 'Molecular Genetics: CRISPR-Cas9 & DNA Cleaving',
    subject: 'Molecular Biology',
    category: 'Biochemistry & Genetics',
    scientificLaw: 'Watson-Crick Base Pairing & Ribonucleoprotein Endonuclease Catalysis',
    coreFormula: 'ΔG_hybridization = ΔH° - TΔS° (gRNA:PAM Target Specificity)',
    defaultCamera: { x: 0, y: 3, z: 12 },
    parameters: [
      { id: 'cleavage_rate', label: 'Endonuclease Cleavage Activity', min: 0, max: 100, step: 1, default: 45, unit: '%' },
      { id: 'helix_twist', label: 'Double Helix Pitch / Turn', min: 5, max: 15, step: 0.5, default: 10.5, unit: 'bp/turn' },
      { id: 'pam_affinity', label: 'PAM Sequence (5-NGG) Affinity', min: 0.1, max: 2.0, step: 0.1, default: 1.0, unit: 'Kd (nM)' }
    ],
    misconception: {
      myth: 'CRISPR acts like physical scissors cutting completely random DNA locations.',
      reality: 'Cas9 requires exact 20-nucleotide complementary base pairing directed by guide RNA and a Protospacer Adjacent Motif (PAM) sequence before activating its HNH and RuvC endonuclease domains.',
      remediationAction: 'Alter the PAM binding slider to observe cleavage inhibition and sequence rejection.'
    },
    audioTone: { baseFreq: 432, type: 'triangle' },
    socraticDialogue: [
      {
        speaker: 'Dr. Maya (Lead Instructor)',
        text: 'Observe the helical backbone of the double helix. The Cas9 protein does not randomly cut DNA—it scans for a specific PAM sequence before unwinding the strands.',
        visualCue: 'ZOOM_DNA_GROOVE'
      },
      {
        speaker: 'Alex (Student)',
        text: 'How does the guide RNA know which sequence matches among billions of base pairs?',
        visualCue: 'HIGHLIGHT_HYDROGEN_BONDS'
      },
      {
        speaker: 'Dr. Maya (Lead Instructor)',
        text: 'Thermodynamic Watson-Crick hydrogen bonding between the 20-nucleotide guide RNA and the target strand releases free energy, triggering conformational docking of the scissor-like catalytic domains.',
        visualCue: 'TRIGGER_ENDONUCLEASE_SHEAR'
      }
    ]
  },

  chemistry_molecular_orbitals: {
    domainId: 'chemistry_molecular_orbitals',
    title: 'Physical Chemistry: Water Dipole & Hydrogen Bonding Network',
    subject: 'Chemistry',
    category: 'Chemical Physics',
    scientificLaw: 'Electronegativity Difference & Intermolecular Dipole-Dipole Attraction',
    coreFormula: 'μ = q · d = 1.854 D | E_H-bond ≈ 20 kJ/mol',
    defaultCamera: { x: 0, y: 4, z: 10 },
    parameters: [
      { id: 'temperature_kelvin', label: 'Thermal Kinetic Energy (T)', min: 200, max: 400, step: 5, default: 298, unit: 'K' },
      { id: 'dipole_strength', label: 'Partial Charge Separation (δ)', min: 0.2, max: 1.0, step: 0.05, default: 0.66, unit: 'e' },
      { id: 'molecular_density', label: 'Water Molecular Cluster Size', min: 4, max: 24, step: 2, default: 12, unit: 'molecules' }
    ],
    misconception: {
      myth: 'Hydrogen bonds are permanent covalent bonds that fuse water molecules into a solid block.',
      reality: 'Hydrogen bonds are transient, highly dynamic electrostatic attractions lasting only picoseconds in liquid water, continually breaking and reforming due to thermal agitation.',
      remediationAction: 'Increase temperature to 373K and watch thermal vibration overcome hydrogen bond cohesion.'
    },
    audioTone: { baseFreq: 528, type: 'sine' },
    socraticDialogue: [
      {
        speaker: 'Dr. Maya (Lead Instructor)',
        text: 'Because oxygen has a Pauling electronegativity of 3.44 compared to hydrogen at 2.20, electron density is pulled toward the oxygen vertex, creating a permanent dipole.',
        visualCue: 'RENDER_ELECTRON_CLOUD'
      },
      {
        speaker: 'Alex (Student)',
        text: 'Is that why water expands when it freezes instead of contracting like normal liquids?',
        visualCue: 'SHOW_CRYSTAL_LATTICE'
      },
      {
        speaker: 'Dr. Maya (Lead Instructor)',
        text: 'Precisely! As kinetic energy drops, tetrahedral hydrogen bonds lock into an open hexagonal crystal lattice, leaving empty spatial cavities that lower ice density.',
        visualCue: 'TRANSITION_HEXAGONAL_ICE'
      }
    ]
  },

  astrophysics_black_hole: {
    domainId: 'astrophysics_black_hole',
    title: 'Relativistic Astrophysics: Kerr-Schwarzschild Black Hole & Accretion Disk',
    subject: 'Astrophysics',
    category: 'Relativity & Cosmology',
    scientificLaw: 'Einstein Field Equations & Geodesic Null Paths in Curved Spacetime',
    coreFormula: 'r_s = 2GM / c² | g_00 = -(1 - 2GM / rc²)',
    defaultCamera: { x: 0, y: 5, z: 14 },
    parameters: [
      { id: 'black_hole_mass', label: 'Black Hole Mass (M_☉)', min: 3, max: 50, step: 1, default: 10, unit: 'Solar Masses' },
      { id: 'accretion_spin', label: 'Kerr Spin Parameter (a*)', min: 0, max: 0.99, step: 0.01, default: 0.85, unit: 'c/G' },
      { id: 'lensing_curvature', label: 'Spacetime Curvature Lensing', min: 0.5, max: 3.0, step: 0.1, default: 1.8, unit: 'x' }
    ],
    misconception: {
      myth: 'A black hole acts like a giant cosmic vacuum cleaner that pulls in all matter instantly from anywhere.',
      reality: 'Outside the event horizon, a black hole gravitational field is identical to any ordinary star of the same mass. Matter must lose angular momentum via friction to spiral inward.',
      remediationAction: 'Observe the stable Keplerian accretion orbits outside the innermost stable circular orbit (ISCO).'
    },
    audioTone: { baseFreq: 110, type: 'sawtooth' },
    socraticDialogue: [
      {
        speaker: 'Dr. Maya (Lead Instructor)',
        text: 'Look closely at the event horizon. The glowing light you see looped over the top is not coming from above—it is the back of the accretion disk gravitationally bent around the pole.',
        visualCue: 'GRAVITATIONAL_LENSING_ARC'
      },
      {
        speaker: 'Alex (Student)',
        text: 'Why does one side of the disk glow so much brighter and bluer than the other?',
        visualCue: 'DOPPLER_BEAMING_CONTRAST'
      },
      {
        speaker: 'Dr. Maya (Lead Instructor)',
        text: 'Relativistic relativistic beaming! Plasma orbiting toward your camera at half the speed of light undergoes extreme Doppler blueshift and intensity amplification.',
        visualCue: 'ISCO_ORBIT_TRACER'
      }
    ]
  },

  electromagnetism_cyclotron: {
    domainId: 'electromagnetism_cyclotron',
    title: 'Electrodynamics: Lorentz Force & Cyclotron Helical Particle Trajectory',
    subject: 'Electromagnetism',
    category: 'Classical Electrodynamics',
    scientificLaw: 'Lorentz Force Law & Perpendicular Magnetic Gyromotion',
    coreFormula: 'F = q(E + v × B) | ω_c = qB / m',
    defaultCamera: { x: 4, y: 6, z: 12 },
    parameters: [
      { id: 'magnetic_field_b', label: 'Magnetic Flux Density (B_z)', min: -5, max: 5, step: 0.2, default: 2.0, unit: 'Tesla' },
      { id: 'particle_velocity', label: 'Injection Velocity (v_x)', min: 1, max: 10, step: 0.5, default: 5.0, unit: '×10⁶ m/s' },
      { id: 'particle_mass_ratio', label: 'Particle Charge/Mass (q/m)', min: 0.5, max: 4.0, step: 0.25, default: 1.0, unit: 'e/u' }
    ],
    misconception: {
      myth: 'A stationary magnetic field does work on a charged particle and increases its kinetic energy.',
      reality: 'Because magnetic force is perpendicular to velocity (v × B), F · v = 0. Magnetic fields can only change particle direction, never speed or kinetic energy.',
      remediationAction: 'Observe that the particle velocity magnitude remains invariant while its trajectory curves into a gyro-helix.'
    },
    audioTone: { baseFreq: 350, type: 'square' },
    socraticDialogue: [
      {
        speaker: 'Dr. Maya (Lead Instructor)',
        text: 'When a proton enters a uniform magnetic field with a velocity component parallel and perpendicular to B, the force is strictly cross-product perpendicular.',
        visualCue: 'RENDER_B_VECTORS'
      },
      {
        speaker: 'Alex (Student)',
        text: 'So if the force is always sideways, does the proton speed up over time?',
        visualCue: 'TRACK_KINETIC_ENERGY'
      },
      {
        speaker: 'Dr. Maya (Lead Instructor)',
        text: 'Never! Work is force dot displacement. Since the magnetic force is orthogonal to velocity, it performs exactly zero Joules of work. The radius changes, but the kinetic speed remains constant.',
        visualCue: 'SHOW_HELICAL_TRAJECTORY'
      }
    ]
  },

  neuroscience_synapse: {
    domainId: 'neuroscience_synapse',
    title: 'Neuroscience: Chemical Synaptic Transmission & Vesicle Exocytosis',
    subject: 'Neurobiology',
    category: 'Physiology & Cellular Biophysics',
    scientificLaw: 'Quantal Neurotransmitter Release & Voltage-Gated Ca²⁺ Influx',
    coreFormula: 'I_Ca = g_Ca · (V_m - E_Ca) | Quantal Content m = n · p',
    defaultCamera: { x: 0, y: 4, z: 11 },
    parameters: [
      { id: 'calcium_influx', label: 'Extracellular Ca²⁺ Influx Rate', min: 0, max: 100, step: 5, default: 60, unit: '%' },
      { id: 'action_potential_freq', label: 'Action Potential Firing Rate', min: 5, max: 120, step: 5, default: 40, unit: 'Hz' },
      { id: 'reuptake_efficiency', label: 'Transporter Reuptake Speed', min: 10, max: 90, step: 5, default: 50, unit: '%' }
    ],
    misconception: {
      myth: 'Electricity jumps directly across the synaptic gap like a miniature lightning bolt.',
      reality: 'Most mammalian synapses are chemical: electrical action potentials trigger calcium influx, which forces neurotransmitter vesicles to fuse with the membrane and diffuse across a 20nm fluid gap.',
      remediationAction: 'Turn Ca²⁺ influx to 0% and observe that electrical potentials halt at the terminal without crossing.'
    },
    audioTone: { baseFreq: 220, type: 'sine' },
    socraticDialogue: [
      {
        speaker: 'Dr. Maya (Lead Instructor)',
        text: 'The 20-nanometer synaptic cleft prevents direct electrical conduction. Instead, electrical signals are transduced into quantal chemical packets.',
        visualCue: 'HIGHLIGHT_SYNAPTIC_GAP'
      },
      {
        speaker: 'Alex (Student)',
        text: 'What triggers these tiny neurotransmitter vesicles to fuse with the pre-synaptic wall?',
        visualCue: 'ANIMATE_SNARE_COMPLEX'
      },
      {
        speaker: 'Dr. Maya (Lead Instructor)',
        text: 'Depolarization opens voltage-gated calcium channels. Inflowing Ca²⁺ ions bind to synaptotagmin, pulling SNARE proteins tight like a zipper to fuse the membrane.',
        visualCue: 'BURST_NEUROTRANSMITTER_DIFFUSION'
      }
    ]
  },

  geophysics_plate_tectonics: {
    domainId: 'geophysics_plate_tectonics',
    title: 'Geophysics: Oceanic-Continental Subduction & Magmatic Arc Formation',
    subject: 'Geophysics',
    category: 'Earth & Planetary Sciences',
    scientificLaw: 'Lithospheric Slab Pull, Mantle Dehydration Melting & Thermal Convection',
    coreFormula: 'F_slab_pull = Δρ · g · V_slab | v_subduction ≈ 5 - 10 cm/year',
    defaultCamera: { x: 5, y: 5, z: 14 },
    parameters: [
      { id: 'subduction_speed', label: 'Convergence Velocity', min: 1, max: 15, step: 0.5, default: 6.5, unit: 'cm/year' },
      { id: 'slab_water_content', label: 'Hydration Dewatering Flux', min: 10, max: 90, step: 5, default: 65, unit: '%' },
      { id: 'asthenosphere_viscosity', label: 'Mantle Convection Heat', min: 1000, max: 1600, step: 25, default: 1350, unit: '°C' }
    ],
    misconception: {
      myth: 'Magma in volcanoes comes from the molten liquid core of the Earth.',
      reality: 'The mantle is solid viscoelastic rock, not liquid. Volcanic magma is created locally when water expelled from the subducting oceanic slab lowers the melting point of the overlying mantle wedge (flux melting).',
      remediationAction: 'Reduce water content slider to 0% and watch the magma ascent plume completely solidify.'
    },
    audioTone: { baseFreq: 65, type: 'sawtooth' },
    socraticDialogue: [
      {
        speaker: 'Dr. Maya (Lead Instructor)',
        text: 'Notice the dense, cold oceanic crust diving beneath the buoyant continental plate into the asthenosphere.',
        visualCue: 'CROSS_SECTION_SUBDUCTION'
      },
      {
        speaker: 'Alex (Student)',
        text: 'Is the rock down there melting purely because of friction from the sliding slab?',
        visualCue: 'THERMAL_GRADIENT_OVERLAY'
      },
      {
        speaker: 'Dr. Maya (Lead Instructor)',
        text: 'A common misconception! Friction provides some heat, but the primary driver is flux melting: mineral-bound seawater is squeezed out of the subducting slab, acting like a flux that drops mantle peridotite melting temperature by hundreds of degrees.',
        visualCue: 'MAGMA_PLUME_BUOYANCY'
      }
    ]
  }
};

module.exports = {
  DOMAIN_REGISTRY
};
