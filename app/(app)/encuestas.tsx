import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Surface,
  ActivityIndicator,
  TextInput,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../../src/lib/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import {
  getSurveys,
  getSurveyById,
  hasUserResponded,
  submitResponse,
  SurveyItem,
  SurveyQuestion,
} from '../../src/services/surveys';

export default function EncuestasScreen() {
  const { user } = useAuth();
  const [surveysList, setSurveysList] = useState<SurveyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyItem | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [alreadyResponded, setAlreadyResponded] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [answers, setAnswers] = useState<Record<string, {
    rating_value?: number;
    text_value?: string;
    selected_option?: string;
  }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSurveys = useCallback(async () => {
    if (!user?.building_id) return;
    try {
      const data = await getSurveys(user.building_id);
      setSurveysList(data);
    } catch (err) {
      console.error('Error fetching surveys:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.building_id]);

  useEffect(() => {
    fetchSurveys();
    pollingRef.current = setInterval(fetchSurveys, 15000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchSurveys]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSurveys();
  }, [fetchSurveys]);

  const openDetail = async (survey: SurveyItem) => {
    setSelectedSurvey(survey);
    setLoadingDetail(true);
    setSubmitted(false);
    setAnswers({});
    try {
      const detail = await getSurveyById(survey.id);
      if (detail) {
        setQuestions(detail.questions);
        if (user?.id) {
          const responded = await hasUserResponded(survey.id, user.id);
          setAlreadyResponded(responded);
        }
      }
    } catch (err) {
      console.error('Error fetching survey detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const getProgress = () => {
    if (questions.length === 0) return 0;
    const answered = questions.filter(q => {
      const a = answers[q.id];
      if (!a) return false;
      if (q.question_type === 'rating') return a.rating_value !== undefined;
      if (q.question_type === 'text') return !!a.text_value?.trim();
      if (q.question_type === 'yes_no' || q.question_type === 'multiple_choice') return !!a.selected_option;
      return false;
    }).length;
    return Math.round((answered / questions.length) * 100);
  };

  const handleSubmit = async () => {
    if (!selectedSurvey || !user) return;
    setSubmitting(true);
    try {
      const answerArray = questions.map(q => ({
        question_id: q.id,
        ...answers[q.id],
      }));
      const success = await submitResponse(
        selectedSurvey.id,
        user.id,
        user.display_name,
        user.unit || null,
        answerArray
      );
      if (success) {
        setSubmitted(true);
        fetchSurveys();
      }
    } catch (err) {
      console.error('Error submitting response:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Detail View ──

  if (selectedSurvey) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Button
          mode="text"
          icon="arrow-left"
          onPress={() => { setSelectedSurvey(null); setQuestions([]); fetchSurveys(); }}
          style={styles.backButton}
          labelStyle={styles.backLabel}
        >
          Volver
        </Button>

        <Surface style={styles.detailHeader} elevation={1}>
          <Text variant="titleLarge" style={styles.detailTitle}>{selectedSurvey.title}</Text>
          {selectedSurvey.description && (
            <Text variant="bodyMedium" style={styles.detailDescription}>{selectedSurvey.description}</Text>
          )}
          <Text variant="bodySmall" style={styles.detailMeta}>
            Creada por {selectedSurvey.created_by}
          </Text>
        </Surface>

        {loadingDetail ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : alreadyResponded ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Icon name="check-circle" size={48} color={Colors.success} />
              <Text variant="titleMedium" style={styles.emptyTitle}>Ya completaste esta encuesta</Text>
              <Text variant="bodySmall" style={styles.emptySubtitle}>Gracias por tu participacion</Text>
            </Card.Content>
          </Card>
        ) : submitted ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Icon name="check-circle" size={48} color={Colors.success} />
              <Text variant="titleMedium" style={styles.emptyTitle}>Gracias por tu respuesta</Text>
              <Text variant="bodySmall" style={styles.emptySubtitle}>Tu opinion nos ayuda a mejorar</Text>
            </Card.Content>
          </Card>
        ) : (
          <>
            {/* Progress */}
            <Surface style={styles.progressCard} elevation={0}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${getProgress()}%` }]} />
              </View>
              <Text variant="bodySmall" style={styles.progressText}>{getProgress()}% completado</Text>
            </Surface>

            {/* Questions */}
            {questions.map((q) => (
              <Surface key={q.id} style={styles.questionCard} elevation={0}>
                <Text variant="bodyMedium" style={styles.questionText}>
                  {q.question_text}
                  {q.is_required && <Text style={styles.required}> *</Text>}
                </Text>

                {q.question_type === 'rating' && (
                  <View style={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map(v => (
                      <Button
                        key={v}
                        mode={answers[q.id]?.rating_value === v ? 'contained' : 'outlined'}
                        compact
                        onPress={() => setAnswers(prev => ({ ...prev, [q.id]: { rating_value: v } }))}
                        style={[
                          styles.ratingButton,
                          answers[q.id]?.rating_value === v && { backgroundColor: Colors.secondary },
                        ]}
                        labelStyle={[
                          styles.ratingLabel,
                          answers[q.id]?.rating_value === v && { color: '#FFF' },
                        ]}
                      >
                        {v}
                      </Button>
                    ))}
                  </View>
                )}

                {q.question_type === 'text' && (
                  <TextInput
                    mode="outlined"
                    value={answers[q.id]?.text_value || ''}
                    onChangeText={v => setAnswers(prev => ({ ...prev, [q.id]: { text_value: v } }))}
                    placeholder="Escriba su respuesta..."
                    multiline
                    numberOfLines={3}
                    style={styles.textInput}
                    outlineStyle={styles.inputOutline}
                  />
                )}

                {q.question_type === 'yes_no' && (
                  <View style={styles.yesNoRow}>
                    {['Si', 'No'].map(opt => (
                      <Button
                        key={opt}
                        mode={answers[q.id]?.selected_option === opt ? 'contained' : 'outlined'}
                        compact
                        onPress={() => setAnswers(prev => ({ ...prev, [q.id]: { selected_option: opt } }))}
                        style={[
                          styles.yesNoButton,
                          answers[q.id]?.selected_option === opt && { backgroundColor: Colors.primary },
                        ]}
                        labelStyle={[
                          styles.yesNoLabel,
                          answers[q.id]?.selected_option === opt && { color: '#FFF' },
                        ]}
                      >
                        {opt}
                      </Button>
                    ))}
                  </View>
                )}

                {q.question_type === 'multiple_choice' && q.options && (
                  <View style={styles.optionsList}>
                    {q.options.map(opt => (
                      <Button
                        key={opt}
                        mode={answers[q.id]?.selected_option === opt ? 'contained' : 'outlined'}
                        compact
                        onPress={() => setAnswers(prev => ({ ...prev, [q.id]: { selected_option: opt } }))}
                        style={[
                          styles.optionButton,
                          answers[q.id]?.selected_option === opt && { backgroundColor: Colors.primary },
                        ]}
                        labelStyle={[
                          styles.optionLabel,
                          answers[q.id]?.selected_option === opt && { color: '#FFF' },
                        ]}
                      >
                        {opt}
                      </Button>
                    ))}
                  </View>
                )}
              </Surface>
            ))}

            <Button
              mode="contained"
              icon="send"
              onPress={handleSubmit}
              disabled={submitting || getProgress() < 100}
              style={styles.submitButton}
              buttonColor={Colors.primary}
            >
              {submitting ? 'Enviando...' : 'Enviar Respuestas'}
            </Button>
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    );
  }

  // ── List View ──

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : surveysList.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="clipboard-check-outline" size={56} color={Colors.textSecondary} />
          <Text variant="bodyLarge" style={styles.emptyTitle}>Sin encuestas</Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            No hay encuestas activas en este momento
          </Text>
        </View>
      ) : (
        surveysList.map(survey => (
          <Card key={survey.id} style={styles.surveyCard} onPress={() => openDetail(survey)}>
            <Card.Content>
              <View style={styles.surveyHeader}>
                <View style={[styles.surveyIcon, { backgroundColor: Colors.infoContainer }]}>
                  <Icon name="clipboard-check" size={20} color={Colors.info} />
                </View>
                <View style={styles.surveyInfo}>
                  <Text variant="titleSmall" style={styles.surveyTitle}>{survey.title}</Text>
                  {survey.description && (
                    <Text variant="bodySmall" style={styles.surveyDesc} numberOfLines={2}>
                      {survey.description}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.surveyFooter}>
                <View style={[styles.miniBadge, { backgroundColor: Colors.successContainer }]}>
                  <Icon name="check-circle" size={12} color={Colors.success} />
                  <Text variant="bodySmall" style={{ color: Colors.success, fontSize: 11 }}>
                    Activa
                  </Text>
                </View>
                <Text variant="bodySmall" style={styles.surveyDate}>
                  {new Date(survey.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ))
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  // Survey card
  surveyCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  surveyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  surveyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  surveyInfo: {
    flex: 1,
  },
  surveyTitle: {
    fontWeight: '600',
    color: Colors.text,
  },
  surveyDesc: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  surveyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  miniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  surveyDate: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  // Detail
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: 8,
    marginTop: 8,
  },
  backLabel: {
    color: Colors.primary,
    fontSize: 13,
  },
  detailHeader: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 16,
    backgroundColor: Colors.surface,
  },
  detailTitle: {
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  detailDescription: {
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  detailMeta: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  // Progress
  progressCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: Colors.surface,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.muted,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    color: Colors.textSecondary,
    marginTop: 6,
    fontSize: 12,
    textAlign: 'right',
  },
  // Question card
  questionCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  questionText: {
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  required: {
    color: Colors.error,
  },
  // Rating
  ratingRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    flex: 1,
    borderRadius: 8,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Text input
  textInput: {
    backgroundColor: Colors.surface,
  },
  inputOutline: {
    borderRadius: 10,
  },
  // Yes/No
  yesNoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  yesNoButton: {
    flex: 1,
    borderRadius: 8,
  },
  yesNoLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Multiple choice
  optionsList: {
    gap: 8,
  },
  optionButton: {
    borderRadius: 8,
  },
  optionLabel: {
    fontSize: 13,
  },
  // Submit
  submitButton: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 12,
  },
  // Empty card
  emptyCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
});
