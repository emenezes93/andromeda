function shouldShowByCondition(q, currentAnswers, conditionalLogic = []) {
    const rule = conditionalLogic.find((r) => r.thenShow.includes(q.id));
    if (!rule)
        return true;
    const answer = currentAnswers[rule.ifQuestion];
    const ifVal = rule.ifValue;
    if (Array.isArray(ifVal)) {
        return Array.isArray(answer) ? answer.some((a) => ifVal.includes(String(a))) : ifVal.includes(String(answer));
    }
    return String(answer) === String(ifVal);
}
function getAnsweredIds(currentAnswers) {
    return new Set(Object.keys(currentAnswers).filter((k) => currentAnswers[k] !== undefined && currentAnswers[k] !== ''));
}
function nextByRules(schema, currentAnswers) {
    const answered = getAnsweredIds(currentAnswers);
    const logic = schema.conditionalLogic ?? [];
    for (const q of schema.questions) {
        if (answered.has(q.id))
            continue;
        if (!shouldShowByCondition(q, currentAnswers, logic))
            continue;
        return { question: q, reason: 'conditional' };
    }
    return { question: null, reason: 'completed' };
}
const DEEPENING_QUESTIONS = {
    stress: {
        id: 'q_deepen_stress',
        text: 'O que mais contribui para seu estresse no dia a dia?',
        type: 'text',
        required: false,
        tags: ['stress'],
    },
    sleep: {
        id: 'q_deepen_sleep',
        text: 'Você acorda durante a noite ou tem dificuldade para adormecer?',
        type: 'single',
        options: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente'],
        required: false,
        tags: ['sleep'],
    },
    food_emotional: {
        id: 'q_deepen_food',
        text: 'Em que momentos você sente mais vontade de comer por emoção?',
        type: 'text',
        required: false,
        tags: ['food_emotional'],
    },
};
function shouldDeepen(tag, currentAnswers, schema) {
    const tagQuestions = schema.questions.filter((q) => q.tags?.includes(tag));
    for (const q of tagQuestions) {
        const v = currentAnswers[q.id];
        if (v === undefined || v === '')
            continue;
        if (q.id === 'q3' && (v === 'Frequentemente' || v === 'Sempre'))
            return true;
        if (q.id === 'q4' && typeof v === 'number' && Number(v) >= 7)
            return true;
        if (['q1', 'q2'].includes(q.id) && typeof v === 'number') {
            if (q.id === 'q1' && Number(v) <= 5)
                return true;
            if (q.id === 'q2' && Number(v) < 6)
                return true;
        }
        if (q.id === 'q5' && (v === 'Frequentemente' || v === 'Às vezes'))
            return true;
    }
    return false;
}
function nextByHeuristic(schema, currentAnswers) {
    const priorityTags = ['stress', 'sleep', 'food_emotional'];
    for (const tag of priorityTags) {
        const deepen = DEEPENING_QUESTIONS[tag];
        if (!deepen)
            continue;
        if (currentAnswers[deepen.id] !== undefined)
            continue;
        if (shouldDeepen(tag, currentAnswers, schema))
            return deepen;
    }
    return null;
}
export function getNextQuestion(schema, currentAnswers) {
    const answered = getAnsweredIds(currentAnswers);
    const totalVisible = schema.questions.filter((q) => shouldShowByCondition(q, currentAnswers, schema.conditionalLogic ?? [])).length;
    const completionPercent = totalVisible === 0 ? 100 : Math.round((answered.size / totalVisible) * 100);
    const byRules = nextByRules(schema, currentAnswers);
    if (byRules.question) {
        return {
            nextQuestion: byRules.question,
            reason: byRules.reason,
            completionPercent,
        };
    }
    const byHeuristic = nextByHeuristic(schema, currentAnswers);
    if (byHeuristic) {
        return {
            nextQuestion: byHeuristic,
            reason: 'heuristic_deepen',
            completionPercent,
        };
    }
    return {
        nextQuestion: null,
        reason: 'completed',
        completionPercent: 100,
    };
}
//# sourceMappingURL=engine.js.map