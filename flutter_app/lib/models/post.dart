import 'package:cloud_firestore/cloud_firestore.dart';

class Post {
  final String id;
  final String? groupId;
  final String title;
  final String caption;
  final String? mediaUrl;
  final String platform;
  final String status;
  final DateTime? scheduledFor;
  final String clientId;
  final List<Comment>? comments;

  Post({
    required this.id,
    this.groupId,
    required this.title,
    required this.caption,
    this.mediaUrl,
    required this.platform,
    required this.status,
    this.scheduledFor,
    required this.clientId,
    this.comments,
  });

  factory Post.fromFirestore(DocumentSnapshot doc) {
    Map data = doc.data() as Map<String, dynamic>;
    return Post(
      id: doc.id,
      groupId: data['groupId'],
      title: data['title'] ?? '',
      caption: data['caption'] ?? '',
      mediaUrl: data['mediaUrl'],
      platform: data['platform'] ?? 'instagram',
      status: data['status'] ?? 'draft',
      scheduledFor: (data['scheduledFor'] as Timestamp?)?.toDate(),
      clientId: data['clientId'] ?? '',
      comments: (data['comments'] as List?)?.map((e) => Comment.fromMap(e)).toList(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'groupId': groupId,
      'title': title,
      'caption': caption,
      'mediaUrl': mediaUrl,
      'platform': platform,
      'status': status,
      'scheduledFor': scheduledFor != null ? Timestamp.fromDate(scheduledFor!) : null,
      'clientId': clientId,
      'comments': comments?.map((e) => e.toMap()).toList(),
    };
  }
}

class Comment {
  final String id;
  final String author;
  final String text;
  final String sentiment;
  final String? status;
  final DateTime createdAt;

  Comment({
    required this.id,
    required this.author,
    required this.text,
    required this.sentiment,
    this.status,
    required this.createdAt,
  });

  factory Comment.fromMap(Map<String, dynamic> data) {
    return Comment(
      id: data['id'] ?? '',
      author: data['author'] ?? '',
      text: data['text'] ?? '',
      sentiment: data['sentiment'] ?? 'neutral',
      status: data['status'],
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'author': author,
      'text': text,
      'sentiment': sentiment,
      'status': status,
      'createdAt': Timestamp.fromDate(createdAt),
    };
  }
}
