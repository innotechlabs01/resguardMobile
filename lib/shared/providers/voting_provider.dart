import 'package:flutter/material.dart';

enum VoteStatus { notVoted, votedInFavor, votedAgainst, votedAbstention }

class VotingProvider extends ChangeNotifier {
  bool _isVotingEnabled = false;
  String? _activeVotingId;
  String? _activeVotingTitle;
  String? _activeVotingDescription;

  final Map<String, VoteStatus> _votesByApartment = {};
  Map<String, int> _voteCounts = {'inFavor': 0, 'against': 0, 'abstention': 0};

  bool get isVotingEnabled => _isVotingEnabled;
  String? get activeVotingId => _activeVotingId;
  String? get activeVotingTitle => _activeVotingTitle;
  String? get activeVotingDescription => _activeVotingDescription;
  Map<String, int> get voteCounts => _voteCounts;
  int get totalVotes =>
      _voteCounts['inFavor']! +
      _voteCounts['against']! +
      _voteCounts['abstention']!;

  bool hasVoted(String apartmentId) {
    return _votesByApartment.containsKey(apartmentId);
  }

  VoteStatus? getVoteStatus(String apartmentId) {
    return _votesByApartment[apartmentId];
  }

  bool canVote(String apartmentId) {
    return _isVotingEnabled && !hasVoted(apartmentId);
  }

  void enableVoting({
    required String votingId,
    required String title,
    required String description,
  }) {
    _isVotingEnabled = true;
    _activeVotingId = votingId;
    _activeVotingTitle = title;
    _activeVotingDescription = description;
    notifyListeners();
  }

  void disableVoting() {
    _isVotingEnabled = false;
    _activeVotingId = null;
    _activeVotingTitle = null;
    _activeVotingDescription = null;
    notifyListeners();
  }

  bool castVote(String apartmentId, VoteStatus vote) {
    if (!_isVotingEnabled) return false;
    if (hasVoted(apartmentId)) return false;

    _votesByApartment[apartmentId] = vote;

    switch (vote) {
      case VoteStatus.votedInFavor:
        _voteCounts['inFavor'] = (_voteCounts['inFavor'] ?? 0) + 1;
        break;
      case VoteStatus.votedAgainst:
        _voteCounts['against'] = (_voteCounts['against'] ?? 0) + 1;
        break;
      case VoteStatus.votedAbstention:
        _voteCounts['abstention'] = (_voteCounts['abstention'] ?? 0) + 1;
        break;
      case VoteStatus.notVoted:
        break;
    }

    notifyListeners();
    return true;
  }

  void resetVotes() {
    _votesByApartment.clear();
    _voteCounts = {'inFavor': 0, 'against': 0, 'abstention': 0};
    notifyListeners();
  }

  double getPercentage(String voteType) {
    if (totalVotes == 0) return 0;
    int count = _voteCounts[voteType] ?? 0;
    return (count / totalVotes) * 100;
  }

  Map<String, dynamic> getResults() {
    return {
      'inFavor': _voteCounts['inFavor'] ?? 0,
      'against': _voteCounts['against'] ?? 0,
      'abstention': _voteCounts['abstention'] ?? 0,
      'total': totalVotes,
      'percentageInFavor': getPercentage('inFavor'),
      'percentageAgainst': getPercentage('against'),
      'percentageAbstention': getPercentage('abstention'),
    };
  }
}
