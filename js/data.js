/* =====================================================================
   data.js — the ONLY file you edit to add papers or news.
   ---------------------------------------------------------------------
   ADD A PAPER : append one object to PAPERS (+ drop images/papers/<key>.jpg)
   ADD  NEWS   : prepend one object to NEWS (newest first)
   Everything (3D walls, panels, flat fallback) renders from here.
   ===================================================================== */

/* Profile constants ------------------------------------------------- */
const PROFILE = {
  name: 'Zhiqin (Brian) Yang',
  role: 'PhD Student @ HKUST',
  email: 'yangzqccc@gmail.com',
  github: 'https://github.com/visitworld123',
  scholar: 'https://scholar.google.com/citations?user=DSjGPu0AAAAJ',
  linkedin: 'https://www.linkedin.com/in/zhiqin-y-50a209193',
  twitter: 'https://x.com/Zhiqin_visity',
  location: 'HKUST · Clear Water Bay · Hong Kong',
  cv: '', // add files/CV.pdf when available
};

/* Topic zones (order = wall layout) --------------------------------- */
const TOPICS = {
  reasoning: { label: 'LLM Reasoning',          wall: 'east',  zone: 1, color: '#e2483d' },
  agents:    { label: 'Agentic Models',         wall: 'east',  zone: 2, color: '#f0a63a' },
  collab:    { label: 'Collaborative Learning', wall: 'south', zone: 1, color: '#1b8a8a' },
  others:    { label: 'Others',                 wall: 'south', zone: 2, color: '#5a6dc4' },
};

/* NOTE on abstracts: concise editor summaries for now — swap in the
   verbatim arXiv abstract per paper anytime (same `abstract` field).   */
const PAPERS = [
  /* --- LLM Reasoning ------------------------------------------------ */
  {
    key: 'yang2026cpo', topic: 'reasoning', selected: true,
    title: 'Conditional Equivalence of DPO and RLHF: Implicit Assumption, Failure Modes, and Provable Alignment',
    authors: ['Zhiqin Yang', 'Yonggang Zhang', 'Wei Xue', 'Dong Fang', 'Bo Han', 'Yike Guo'],
    venue: 'ICML 2026 Spotlight', year: 2026,
    abstract: 'We revisit when Direct Preference Optimization (DPO) is truly equivalent to RLHF, making the implicit assumption behind that equivalence explicit. We characterize the failure modes where the equivalence breaks down and give conditions for provable alignment, clarifying when the simpler DPO objective can safely stand in for full RLHF.',
    links: { pdf: 'https://arxiv.org/pdf/2605.20834' },
    img: 'images/papers/cpo.png',
  },
  {
    key: 'li2025learnalign', topic: 'reasoning', selected: true,
    title: 'LearnAlign: Reasoning Data Selection for Reinforcement Learning in Large Language Models Based on Improved Gradient Alignment',
    authors: ['Shipeng Li*', 'Zhiqin Yang*', 'Shikun Li*', 'Xiaobo Xia', 'Hengyu Liu', 'Xinghua Zhang', 'Gaode Chen', 'Dong Fang', 'Yang Tai', 'Zhe Peng'],
    venue: 'ACL 2026 Findings', year: 2026,
    abstract: 'LearnAlign selects high-quality reasoning data for reinforcement learning post-training of LLMs using an improved gradient-alignment criterion, identifying the examples whose gradients best align with the target reasoning objective so that RL training is more sample-efficient and effective.',
    links: { pdf: 'https://arxiv.org/pdf/2506.11480' },
    img: 'images/papers/learnalign.png',
  },
  {
    key: 'yang2026shaping', topic: 'reasoning', selected: false,
    title: 'Shaping Schema via Language Representation as the Next Frontier for LLM Intelligence Expanding',
    authors: ['Zhiqin Yang', 'Yuhan Liu', 'Jingwen Fu', 'Pei Fu', 'Bo Han', 'Masashi Sugiyama', 'Nanning Zheng'],
    venue: 'Position paper · arXiv:2605.09271', year: 2026,
    abstract: 'A position paper arguing that shaping schema through language representation is the next frontier for expanding LLM intelligence, laying out linguistic principles for foundation models and the research agenda they motivate.',
    links: { pdf: 'https://arxiv.org/pdf/2605.09271' },
    img: 'images/papers/shaping.png',
  },

  /* --- LLM Agents --------------------------------------------------- */
  {
    key: 'yang2026clawnet', topic: 'agents', selected: true,
    title: 'ClawNet: Human-Symbiotic Agent Network for Cross-User Autonomous Cooperation',
    authors: ['Zhiqin Yang', 'Zhenyuan Zhang', 'Xianzhang Jia', 'Jun Song', 'Wei Xue', 'Yonggang Zhang', 'Yike Guo'],
    venue: 'ICML 2026 TAIGR', year: 2026,
    abstract: 'ClawNet is a human-symbiotic agent network for cross-user autonomous cooperation — a framework from HKGAI@HKUST for AI-agent governance, letting agents cooperate across users while keeping humans in the loop.',
    links: { pdf: 'https://arxiv.org/pdf/2604.19211', web: 'https://www.clawnet.hk/' },
    img: 'images/papers/clawnet.png',
  },
  {
    key: 'wang2026zero2skill', topic: 'agents', selected: true,
    title: 'Zero2Skill: Bootstrapping Robot Skills through Autonomous Data Collection, Training, and Deployment',
    authors: ['Boyuan Wang*', 'Zhenyuan Zhang*', 'Zhiqin Yang*', 'Peijun Gu', 'Shuya Wang', 'Xiaofeng Wang', 'Xianghui Ze', 'Yifan Chang', 'Guosheng Zhao', 'Jiangnan Shao', 'Guan Huang', 'Hengyu Liu', 'Yonggang Zhang', 'Wei Xue', 'Chunyuan Guan', 'Chenglin Pu', 'Yike Guo', 'Xingang Wang', 'Zheng Zhu'],
    venue: 'arXiv:2607.14047', year: 2026,
    abstract: 'Autonomous data collection governs both the volume and quality of real-world trajectories available for manipulation policy learning. Existing pipelines reduce human effort through self-resetting mechanisms, VLM-based verification, or language-guided correction. However, in long-horizon collection, the same failure modes recur across episodes. A correction scoped to the episode at hand must be re-issued at every recurrence, so the cost of oversight grows with session duration rather than with the number of distinct problems. We present Zero2Skill, a human-robot symbiotic agentic system in which the robot improves under natural-language guidance. The operator supplies corrective knowledge in natural language, and every correction is retained for reuse in all subsequent rounds. As this knowledge accumulates, a failure mode that has been corrected once is typically handled automatically thereafter, so the operator’s attention is drawn to new problems rather than to recurrences of old ones. Zero2Skill formulates the collection loop as a verification-gated decision process, in which the system collects, verifies, and resets autonomously and pauses to notify a remote operator only when a phase fails verification repeatedly, a boundary set by an explicit retry budget. The operator describes the observed problem in natural language. An LLM parser translates each utterance into a structured system adjustment and stores it in a Corrective Memory consulted on subsequent rounds, so that an addressed failure mode is less likely to require a second correction under the same conditions. On a real-robot desktop-clearing testbed, Zero2Skill matches the episode collection success rate of full human teleoperation while reducing human working time to 16% of that required by teleoperation. Language corrections repair both verifier criteria and execution strategies, improving the verifier’s agreement with human labels in all four evaluated settings and raising average single-attempt collection success from 12.5% to 47.5%, with a separate arm-selection correction improving it from 20.0% to 50.0%. Closing the loop to deployment, policies fine-tuned on Zero2Skill-collected data match the policy success rate of those trained on full teleoperation data while requiring only a fraction of the human working time during collection.',
    links: { pdf: 'https://arxiv.org/pdf/2604.19211', web: 'https://open-gigaai.github.io/Zero2Skill' },
    img: 'images/papers/zero2skill.png',
  },
  {
    key: 'zhang2026memfly', topic: 'agents', selected: false,
    title: 'MemFly: On-the-Fly Memory Optimization via Information Bottleneck',
    authors: ['Zhenyuan Zhang', 'Xianzhang Jia', 'Zhiqin Yang', 'Zhenbo Song', 'Wei Xue', 'Sirui Han', 'Yike Guo'],
    venue: 'ICLR 2026 MemAgent Workshop · arXiv:2602.07885', year: 2026,
    abstract: 'MemFly optimizes agent memory on the fly through an information-bottleneck objective, compressing and retaining the most task-relevant memory for agent workflows without offline re-training.',
    links: { pdf: 'https://arxiv.org/pdf/2602.07885' },
    img: 'images/papers/memfly.png',
  },
  {
    key: 'liu2025ir3d', topic: 'agents', selected: false,
    title: 'IR3D-Bench: Evaluating Vision-Language Model Scene Understanding as Agentic Inverse Rendering',
    authors: ['Parker Liu', 'Chenxin Li', 'Zhengxin Li', 'Yipeng Wu', 'Wuyang Li', 'Zhiqin Yang', 'Zhenyuan Zhang', 'Yunlong Lin', 'Sirui Han', 'Brandon Y. Feng'],
    venue: 'NeurIPS 2025', year: 2025,
    abstract: 'IR3D-Bench evaluates vision-language models on 3D scene understanding by framing it as agentic inverse rendering: the model must actively reconstruct a scene, testing whether VLMs genuinely understand spatial structure rather than pattern-matching.',
    links: { pdf: 'https://arxiv.org/pdf/2506.23329' },
    img: 'images/papers/ir3d.png',
  },

  /* --- Collaborative Learning -------------------------------------- */
  {
    key: 'yang2025fedgps', topic: 'collab', selected: true,
    title: 'FedGPS: Statistical Rectification Against Data Heterogeneity in Federated Learning',
    authors: ['Zhiqin Yang', 'Yonggang Zhang', 'Chenxin Li', 'Yiu-ming Cheung', 'Bo Han', 'Yixuan Yuan'],
    venue: 'NeurIPS 2025', year: 2025,
    abstract: 'FedGPS tackles data heterogeneity in federated learning through statistical rectification, correcting client-side statistical shifts so that the aggregated global model stays robust when clients hold non-IID data.',
    links: { pdf: 'https://arxiv.org/pdf/2510.20250' },
    img: 'images/papers/FedGPS.png',
  },
  {
    key: 'yang2024fedfed', topic: 'collab', selected: true,
    title: 'FedFed: Feature Distillation against Data Heterogeneity in Federated Learning',
    authors: ['Zhiqin Yang', 'Yonggang Zhang', 'Yu Zheng', 'Xinmei Tian', 'Hao Peng', 'Tongliang Liu', 'Bo Han'],
    venue: 'NeurIPS 2023', year: 2023,
    abstract: 'FedFed partitions features into performance-sensitive and performance-robust parts and shares a distilled, privacy-protected version of the sensitive features, mitigating data heterogeneity in federated learning while limiting information exposure.',
    links: { pdf: 'https://proceedings.neurips.cc/paper_files/paper/2023/file/bdcdf38389d7fcefc73c4c3720217155-Paper-Conference.pdf', code: 'https://github.com/visitworld123/FedFed' },
    img: 'images/papers/FedFed.png',
  },
  {
    key: 'wen2026fedrg', topic: 'collab', selected: false,
    title: 'FedRG: Unleashing the Representation Geometry for Federated Learning with Noisy Clients',
    authors: ['Tian Wen*', 'Zhiqin Yang*', 'Yonggang Zhang', 'Xuefeng Jiang', 'Hao Peng', 'Yuwei Wang', 'Bo Han'],
    venue: 'CVPR 2026', year: 2026,
    abstract: 'FedRG rethinks the federated noisy-client problem by exploiting representation geometry, using the structure of learned representations to stay robust when some clients carry noisy labels.',
    links: { pdf: 'https://arxiv.org/abs/2603.19722', code: 'https://github.com/Tianjoker/FedRG' },
    img: 'images/papers/FedRG.png',
  },
  {
    key: 'zhangrobust', topic: 'collab', selected: true,
    title: 'Robust Training of Federated Models with Extremely Label Deficiency',
    authors: ['Yonggang Zhang*', 'Zhiqin Yang*', 'Xinmei Tian', 'Nannan Wang', 'Tongliang Liu', 'Bo Han'],
    venue: 'ICLR 2024', year: 2024,
    abstract: 'Twin-sight enables robust federated semi-supervised learning under extreme label deficiency, using twin models to exploit abundant unlabeled data across clients when labels are scarce.',
    links: { pdf: 'https://arxiv.org/pdf/2402.14430', code: 'https://github.com/visitworld123/Twin-sight' },
    img: 'images/papers/twin-sight.png',
  },
  {
    key: 'ji2024emerging', topic: 'collab', selected: false,
    title: 'Emerging Trends in Federated Learning: From Model Fusion to Federated X Learning',
    authors: ['Shaoxiong Ji', 'Yue Tan', 'Teemu Saravirta', 'Zhiqin Yang', 'Yixin Liu', 'Lauri Vasankari', 'Shirui Pan', 'Guodong Long', 'Anwar Walid'],
    venue: 'IJMLC 2024', year: 2024,
    abstract: 'A survey of emerging directions in federated learning, tracing the field from model fusion toward "federated X learning" — the integration of federated learning with transfer, meta, multi-task, and other learning paradigms.',
    links: { pdf: 'https://link.springer.com/article/10.1007/s13042-024-02119-1' },
  },

  /* --- Others ------------------------------------------------------- */
  {
    key: 'wang2025humandreamer', topic: 'others', selected: false,
    title: 'HumanDreamer: Generating Controllable Human-Motion Videos via Decoupled Generation',
    authors: ['Boyuan Wang', 'Xiaofeng Wang', 'Chaojun Ni', 'Guosheng Zhao', 'Zhiqin Yang', 'Zheng Zhu', 'Muyang Zhang', 'Yukun Zhou', 'Xinze Chen', 'Guan Huang', 'et al.'],
    venue: 'CVPR 2025', year: 2025,
    abstract: 'HumanDreamer generates controllable human-motion videos through a decoupled pipeline that separates motion generation from appearance rendering, improving controllability and quality of synthesized human videos.',
    links: { pdf: 'https://openaccess.thecvf.com/content/CVPR2025/papers/Wang_HumanDreamer_Generating_Controllable_Human-Motion_Videos_via_Decoupled_Generation_CVPR_2025_paper.pdf' },
    img: 'images/papers/humandreamer.png',
  },
  {
    key: 'liu2025hide', topic: 'others', selected: false,
    title: 'Hide-in-Motion: Embedding Steganographic Copyright Information into 4D Gaussian Splatting Assets',
    authors: ['Hengyu Liu', 'Chenxin Li', 'Wentao Pan', 'Zhiqin Yang', 'Yifeng Yang', 'Yifan Liu', 'Wuyang Li', 'Yixuan Yuan'],
    venue: 'ICRA 2025', year: 2025,
    abstract: 'Hide-in-Motion embeds steganographic copyright information into 4D Gaussian Splatting assets, hiding an imperceptible watermark in the dynamic scene representation to protect ownership of 3D/4D content.',
    links: { pdf: 'https://ieeexplore.ieee.org/stamp/stamp.jsp?arnumber=11128285' },
    img: 'images/papers/Hide.png',
  },
  {
    key: 'yang2023rosgas', topic: 'others', selected: false,
    title: 'RoSGAS: Adaptive Social Bot Detection with Reinforced Self-Supervised GNN Architecture Search',
    authors: ['Yingguang Yang', 'Renyu Yang', 'Yangyang Li', 'Kai Cui', 'Zhiqin Yang', 'Yue Wang', 'Jie Xu', 'Haiyong Xie'],
    venue: 'ACM TWEB 2023', year: 2023,
    abstract: 'RoSGAS detects social bots by searching for graph-neural-network architectures with reinforcement learning and self-supervision, adapting the model structure per node to improve robustness and detection accuracy.',
    links: { pdf: 'https://arxiv.org/pdf/2206.06757' },
    img: 'images/papers/RosGas.png',
  },
  {
    key: 'yang2026SeInEvent', topic: 'others', selected: false,
    title: 'Structural Entropy Guided Incremental Learning for Open-World Multimodal Social Event Detection',
    authors: ['Zhiwei Yang', 'Haimei Qin', 'Xiaoyan Yu', 'Hao Peng', 'Lei Jiang', 'Li Sun', 'Zhiqin Yang'],
    venue: 'AAAI 2026', year: 2026,
    abstract: 'A structural-entropy-guided incremental learning method for open-world multimodal social event detection, using structural entropy to organize evolving event structure and continually learn newly emerging events.',
    links: {},
    img: 'images/papers/structural.png',
  },
  {
    key: 'cai2023efficient', topic: 'others', selected: false,
    title: 'Efficient Side-Channel Attack through Balanced Labels Compression and Variational Autoencoder',
    authors: ['Nengfu Cai', 'Zhiqin Yang', 'Shuhai Wang', 'Yanling Jiang', 'Mingsheng Liu', 'Gang Li'],
    venue: 'MSN 2023', year: 2023,
    abstract: 'An efficient side-channel attack that combines balanced label compression with a variational autoencoder to extract secret information from leakage traces more effectively under class imbalance.',
    links: { pdf: 'https://ieeexplore.ieee.org/abstract/document/10566963/' },
  },
];

/* News — newest first. Prepend to add. -------------------------------- */
const NEWS = [
  { date: '2026-07-13', html: '📢 Call for papers! Co-hosting the <a href="https://lp4fm.github.io/" target="_blank" rel="noopener">Workshop on Linguistic Principles for Foundation Models (LP4FM)</a> — see the <a href="https://arxiv.org/abs/2605.09271" target="_blank" rel="noopener">position paper</a>. See you in Sydney!' },
  { date: '2026-05-01', html: 'First-author paper rethinking the equivalence between <b>DPO and RLHF</b> accepted by <b>ICML 2026</b> as a <b>Spotlight</b> — congrats to all collaborators!' },
  { date: '2026-04-07', html: '<a href="https://arxiv.org/pdf/2506.11480" target="_blank" rel="noopener">LearnAlign</a> (reasoning-data selection for LLM post-training) accepted by <b>ACL 2026</b> Findings.' },
  { date: '2026-04-04', html: 'Released <a href="https://www.clawnet.hk/" target="_blank" rel="noopener">ClawNet</a>, our human-agent symbiosis framework from <b>HKGAI@HKUST</b> for AI-agent governance — <a href="https://arxiv.org/pdf/2604.19211" target="_blank" rel="noopener">technical report</a>.' },
  { date: '2026-02-21', html: 'One co-first-author paper on rethinking the <b>federated noisy-client</b> problem accepted by <b>CVPR 2026</b>.' },
  { date: '2026-02-10', html: 'Released <a href="https://arxiv.org/abs/2602.07885" target="_blank" rel="noopener">MemFly</a> for the agent-memory workflow (accepted to the <b>ICLR 2026</b> MemAgent workshop).' },
  { date: '2025-09-20', html: 'Two papers accepted by <b>NeurIPS 2025</b>: <a href="https://arxiv.org/abs/2510.20250" target="_blank" rel="noopener">FedGPS</a> (federated heterogeneity) and <a href="https://arxiv.org/abs/2506.23329" target="_blank" rel="noopener">IR3D-Bench</a> (VLM spatial understanding). See you in San Diego!' },
  { date: '2024-07-01', html: 'Graduated from <b>Beihang University</b> with the <b>Outstanding Master Thesis Award</b>. ✨' },
];

/* Academic service & talks — fill these in (shown in the Service / Talks panels). */
const SERVICE = {
  conference: [
    'NeurIPS (2024–25)', 'ICML (2025–26)', 'ICLR (2023–26)', 'CVPR (2026)', 'AAAI (2026)',
    'ACM MM (2024)', 'ECCV (2026)', 'ICASSP (2025–26)', 'WACV (2025)', 'ICRA (2025)',
    'AISTATS (2025–26)', 'IJCNN (2025)', 'UAI (2025)', 'CPAL (2026)',
  ],
  journal: [
    'IEEE TPAMI', 'Information Fusion', 'ACM TIST', 'IJMLC', 'MLJ (Machine Learning)',
    'Neural Networks', 'JAIR', 'IEEE TAI', 'TMLR',
  ],
};
const TALKS = [
  // { date:'2026-05', title:'Talk title', venue:'Where', link:'' },
];

/* Guestbook (Supabase) — fill url + anonKey after creating a free project (see README).
   Leave blank to keep the guestbook in "not connected yet" mode. */
const GUESTBOOK = { url: '', anonKey: '', table: 'guestbook' };

/* expose for main.js (and flat fallback) */
window.SITE = { PROFILE, TOPICS, PAPERS, NEWS, SERVICE, TALKS, GUESTBOOK };
