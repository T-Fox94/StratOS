import 'package:google_generative_ai/google_generative_ai.dart';

class GeminiService {
  final String apiKey;
  late final GenerativeModel _model;

  GeminiService({required this.apiKey}) {
    _model = GenerativeModel(
      model: 'gemini-3-flash-preview',
      apiKey: apiKey,
    );
  }

  Future<String> getChatResponse(String message, String context) async {
    try {
      final prompt = 'Context: $context\n\nUser: $message';
      final content = [Content.text(prompt)];
      final response = await _model.generateContent(content);
      return response.text ?? "I'm sorry, I couldn't process that.";
    } catch (e) {
      print('Error getting chat response: $e');
      return "Error communicating with AI. Please check your connection.";
    }
  }

  Future<String> generateCaption(String clientName, String tone, String visualStyle) async {
    try {
      final prompt = '''Generate a natural, engaging social media caption for a client named "$clientName". 
      Tone: $tone. 
      Visual Style: $visualStyle. 
      The response should be nicely paragraphed and include relevant hashtags. 
      Avoid corporate jargon. Make it feel human and authentic.''';
      final content = [Content.text(prompt)];
      final response = await _model.generateContent(content);
      return response.text ?? "";
    } catch (e) {
      print('Error generating AI caption: $e');
      return "Error generating caption. Please try again.";
    }
  }
}
