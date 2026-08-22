import { supabase } from './supabase';

export interface SurveyItem {
  id: string;
  building_id: string;
  title: string;
  description: string | null;
  created_by: string;
  status: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

export interface SurveyQuestion {
  id: string;
  survey_id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  is_required: boolean;
  order_index: number;
  created_at: string;
}

// ── Get surveys list ──

export async function getSurveys(buildingId: string): Promise<SurveyItem[]> {
  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('building_id', buildingId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching surveys:', error);
    return [];
  }
  return (data || []) as SurveyItem[];
}

// ── Get survey by ID ──

export async function getSurveyById(id: string): Promise<{
  survey: SurveyItem;
  questions: SurveyQuestion[];
  alreadyResponded: boolean;
} | null> {
  const { data: survey, error: surveyErr } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', id)
    .single();

  if (surveyErr || !survey) {
    console.error('Error fetching survey:', surveyErr);
    return null;
  }

  const { data: questions } = await supabase
    .from('survey_questions')
    .select('*')
    .eq('survey_id', id)
    .order('order_index', { ascending: true });

  return {
    survey: survey as SurveyItem,
    questions: (questions || []) as SurveyQuestion[],
    alreadyResponded: false, // Will be checked separately
  };
}

// ── Check if user already responded ──

export async function hasUserResponded(surveyId: string, userId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('survey_responses')
    .select('*', { count: 'exact', head: true })
    .eq('survey_id', surveyId)
    .eq('respondent_id', userId);

  if (error) {
    console.error('Error checking response:', error);
    return false;
  }
  return (count ?? 0) > 0;
}

// ── Submit response ──

export async function submitResponse(
  surveyId: string,
  respondentId: string,
  respondentName: string,
  respondentUnit: string | null,
  answers: Array<{
    question_id: string;
    rating_value?: number | null;
    text_value?: string | null;
    selected_option?: string | null;
  }>
): Promise<boolean> {
  const rows = answers.map(answer => ({
    survey_id: surveyId,
    question_id: answer.question_id,
    respondent_id: respondentId,
    respondent_name: respondentName,
    respondent_unit: respondentUnit,
    rating_value: answer.rating_value ?? null,
    text_value: answer.text_value || null,
    selected_option: answer.selected_option || null,
  }));

  const { error } = await supabase.from('survey_responses').insert(rows);

  if (error) {
    console.error('Error submitting response:', error);
    return false;
  }
  return true;
}
