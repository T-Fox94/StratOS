import 'package:cloud_firestore/cloud_firestore.dart';

class Client {
  final String id;
  final String name;
  final String slug;
  final String industry;
  final String? logo;
  final String status;
  final String riskLevel;
  final int monthlyQuota;
  final int currentMonthUsage;
  final String? toneOfVoice;
  final String? visualStyle;
  final List<String>? brandColors;
  final List<String>? approvedHashtags;
  final String? primaryColor;

  Client({
    required this.id,
    required this.name,
    required this.slug,
    required this.industry,
    this.logo,
    required this.status,
    required this.riskLevel,
    required this.monthlyQuota,
    required this.currentMonthUsage,
    this.toneOfVoice,
    this.visualStyle,
    this.brandColors,
    this.approvedHashtags,
    this.primaryColor,
  });

  factory Client.fromFirestore(DocumentSnapshot doc) {
    Map data = doc.data() as Map<String, dynamic>;
    return Client(
      id: doc.id,
      name: data['name'] ?? '',
      slug: data['slug'] ?? '',
      industry: data['industry'] ?? '',
      logo: data['logo'],
      status: data['status'] ?? 'active',
      riskLevel: data['riskLevel'] ?? 'low',
      monthlyQuota: data['monthlyQuota'] ?? 20,
      currentMonthUsage: data['currentMonthUsage'] ?? 0,
      toneOfVoice: data['toneOfVoice'],
      visualStyle: data['visualStyle'],
      brandColors: (data['brandColors'] as List?)?.map((e) => e.toString()).toList(),
      approvedHashtags: (data['approvedHashtags'] as List?)?.map((e) => e.toString()).toList(),
      primaryColor: data['primaryColor'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'slug': slug,
      'industry': industry,
      'logo': logo,
      'status': status,
      'riskLevel': riskLevel,
      'monthlyQuota': monthlyQuota,
      'currentMonthUsage': currentMonthUsage,
      'toneOfVoice': toneOfVoice,
      'visualStyle': visualStyle,
      'brandColors': brandColors,
      'approvedHashtags': approvedHashtags,
      'primaryColor': primaryColor,
    };
  }
}
