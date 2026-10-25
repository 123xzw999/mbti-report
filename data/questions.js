/* MBTI 32 题词对量表
 * 题目来源：Open Extended Jungian Type Scales 1.2 (OEJTS 1.2) 第一部分
 * 原始量表：Eric Jorgenson (2014), Open-Source Psychometrics Project
 *          https://openpsychometrics.org/tests/OEJTS/
 * 量表性质：公开发布的学术替代量表，非官方 MBTI 测评
 * 计分：5 点语义差异量表，每维度 8 题，维度得分区间 8–40，中位 24
 */
window.QUESTIONS = [
  { id: 1,  dim: 'JP', left: 'J', cn: ['做事先列清单', '凭记忆来'],              en: ['makes lists', 'relies on memory'] },
  { id: 2,  dim: 'TF', left: 'T', cn: ['习惯先怀疑', '愿意去相信'],              en: ['sceptical', 'wants to believe'] },
  { id: 3,  dim: 'EI', left: 'E', cn: ['独处久了会无聊', '必须有独处时间'],        en: ['bored by time alone', 'needs time alone'] },
  { id: 4,  dim: 'SN', left: 'S', cn: ['接受事物本来的样子', '总觉得现状该被改变'], en: ['accepts things as they are', 'unsatisfied with the ways things are'] },
  { id: 5,  dim: 'JP', left: 'J', cn: ['房间保持整洁', '东西随手放'],            en: ['keeps a clean room', 'just puts stuff where ever'] },
  { id: 6,  dim: 'TF', left: 'F', cn: ['觉得「像机器」是句骂人的话', '希望自己像机器一样理性'], en: ['thinks "robotic" is an insult', 'strives to have a mechanical mind'] },
  { id: 7,  dim: 'EI', left: 'E', cn: ['精力充沛', '温和内敛'],                  en: ['energetic', 'mellow'] },
  { id: 8,  dim: 'SN', left: 'S', cn: ['更喜欢选择题', '更喜欢论述题'],          en: ['prefer to take multiple choice test', 'prefer essay answers'] },
  { id: 9,  dim: 'JP', left: 'P', cn: ['随性、有点乱', '井井有条'],              en: ['chaotic', 'organized'] },
  { id: 10, dim: 'TF', left: 'F', cn: ['容易被伤到', '脸皮厚、不太在意'],        en: ['easily hurt', 'thick-skinned'] },
  { id: 11, dim: 'EI', left: 'E', cn: ['在团队里效率最高', '独处时效率最高'],    en: ['works best in groups', 'works best alone'] },
  { id: 12, dim: 'SN', left: 'S', cn: ['关注当下', '关注未来'],                  en: ['focused on the present', 'focused on the future'] },
  { id: 13, dim: 'JP', left: 'J', cn: ['提前很久就做计划', '最后一刻才安排'],    en: ['plans far ahead', 'plans at the last minute'] },
  { id: 14, dim: 'TF', left: 'T', cn: ['更希望被人尊重', '更希望被人喜欢'],      en: ["wants people's respect", 'wants their love'] },
  { id: 15, dim: 'EI', left: 'I', cn: ['聚会之后精疲力尽', '聚会之后越玩越兴奋'], en: ['gets worn out by parties', 'gets fired up by parties'] },
  { id: 16, dim: 'SN', left: 'S', cn: ['融入人群', '脱颖而出'],                  en: ['fits in', 'stands out'] },
  { id: 17, dim: 'JP', left: 'P', cn: ['保持选择开放', '尽早做出决定'],          en: ['keeps options open', 'commits'] },
  { id: 18, dim: 'TF', left: 'T', cn: ['更想擅长修东西', '更想擅长安抚人'],      en: ['wants to be good at fixing things', 'wants to be good at fixing people'] },
  { id: 19, dim: 'EI', left: 'E', cn: ['说得多', '听得多'],                      en: ['talks more', 'listens more'] },
  { id: 20, dim: 'SN', left: 'S', cn: ['讲清楚发生了什么', '讲清楚它意味着什么'], en: ['when describing an event, will tell people what happened', 'will tell people what it meant'] },
  { id: 21, dim: 'JP', left: 'J', cn: ['立刻把事做完', '总拖到最后'],            en: ['gets work done right away', 'procrastinates'] },
  { id: 22, dim: 'TF', left: 'F', cn: ['跟着心走', '跟着脑走'],                  en: ['follows the heart', 'follows the head'] },
  { id: 23, dim: 'EI', left: 'I', cn: ['待在家里', '出门去热闹的地方'],          en: ['stays at home', 'goes out on the town'] },
  { id: 24, dim: 'SN', left: 'N', cn: ['要全局大图', '要具体细节'],              en: ['wants the big picture', 'wants the details'] },
  { id: 25, dim: 'JP', left: 'P', cn: ['临场发挥', '提前准备'],                  en: ['improvises', 'prepares'] },
  { id: 26, dim: 'TF', left: 'T', cn: ['道德应基于公正', '道德应基于同情'],      en: ['bases morality on justice', 'bases morality on compassion'] },
  { id: 27, dim: 'EI', left: 'I', cn: ['很难大声喊出来', '隔着老远喊人很自然'],  en: ['finds it difficult to yell very loudly', 'yelling to others when they are far away comes naturally'] },
  { id: 28, dim: 'SN', left: 'N', cn: ['偏理论', '偏实证'],                      en: ['theoretical', 'empirical'] },
  { id: 29, dim: 'JP', left: 'J', cn: ['工作拼命', '玩得尽兴'],                  en: ['works hard', 'plays hard'] },
  { id: 30, dim: 'TF', left: 'T', cn: ['面对情绪会不自在', '很看重情绪'],        en: ['uncomfortable with emotions', 'values emotions'] },
  { id: 31, dim: 'EI', left: 'E', cn: ['喜欢在人前表现', '回避当众讲话'],        en: ['likes to perform in front of other people', 'avoids public speaking'] },
  { id: 32, dim: 'SN', left: 'S', cn: ['想知道「谁、什么、何时」', '想知道「为什么」'], en: ['likes to know "who?", "what?", "when?"', 'likes to know "why?"'] }
];

/* 四个维度的定义 */
window.DIMENSIONS = {
  EI: { name: '能量方向', first: 'E', a: 'E', b: 'I', an: '外向', bn: '内向',
        desc: '你的能量朝外流向人群与活动，还是朝内流向想法与反思。' },
  SN: { name: '信息获取', first: 'S', a: 'S', b: 'N', an: '实感', bn: '直觉',
        desc: '你更信任具体事实与细节，还是更信任模式与可能性。' },
  TF: { name: '决策方式', first: 'T', a: 'T', b: 'F', an: '思考', bn: '情感',
        desc: '你做决定时更依靠逻辑分析，还是更依靠价值与对人的影响。' },
  JP: { name: '生活取向', first: 'J', a: 'J', b: 'P', an: '判断', bn: '知觉',
        desc: '你偏好结构与结论，还是偏好灵活与开放。' }
};
