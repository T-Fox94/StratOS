import 'package:cloud_firestore/cloud_firestore.dart';

class CrisisEvent {
  final String id;
  final String title;
  final String description;
  final String severity;
  final String status;
  final String clientId;
  final DateTime createdAt;

  CrisisEvent({
    required this.id,
    required this.title,
    required this.description,
    required this.severity,
    required this.status,
    required this.clientId,
    required this.createdAt,
  });

  factory CrisisEvent.fromFirestore(DocumentSnapshot doc) {
    Map data = doc.data() as Map<String, dynamic>;
    return CrisisEvent(
      id: doc.id,
      title: data['title'] ?? '',
      description: data['description'] ?? '',
      severity: data['severity'] ?? 'medium',
      status: data['status'] ?? 'active',
      clientId: data['clientId'] ?? '',
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'title': title,
      'description': description,
      'severity': severity,
      'status': status,
      'clientId': clientId,
      'createdAt': Timestamp.fromDate(createdAt),
    };
  }
}
