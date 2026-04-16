import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/firebase_service.dart';
import '../models/client.dart';
import '../models/post.dart';
import '../models/crisis_event.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    final firebaseService = Provider.of<FirebaseService>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('StratOS Dashboard'),
        actions: [
          IconButton(
            onPressed: () async {
              await firebaseService.signOut();
            },
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: _buildBody(context, firebaseService),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) => setState(() => _selectedIndex = index),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Overview',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.business),
            label: 'Clients',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.warning),
            label: 'Crisis',
          ),
        ],
      ),
    );
  }

  Widget _buildBody(BuildContext context, FirebaseService firebaseService) {
    switch (_selectedIndex) {
      case 0:
        return _buildOverview(context, firebaseService);
      case 1:
        return _buildClients(context, firebaseService);
      case 2:
        return _buildCrisis(context, firebaseService);
      default:
        return const Center(child: Text('Unknown View'));
    }
  }

  Widget _buildOverview(BuildContext context, FirebaseService firebaseService) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Recent Activity',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          StreamBuilder<List<Post>>(
            stream: firebaseService.getPosts(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              if (!snapshot.hasData || snapshot.data!.isEmpty) {
                return const Text('No recent posts.');
              }
              return ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: snapshot.data!.length,
                itemBuilder: (context, index) {
                  final post = snapshot.data![index];
                  return Card(
                    child: ListTile(
                      title: Text(post.title),
                      subtitle: Text(post.caption),
                      trailing: Chip(label: Text(post.status)),
                    ),
                  );
                },
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildClients(BuildContext context, FirebaseService firebaseService) {
    return StreamBuilder<List<Client>>(
      stream: firebaseService.getClients(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const Center(child: Text('No clients found.'));
        }
        return ListView.builder(
          itemCount: snapshot.data!.length,
          itemBuilder: (context, index) {
            final client = snapshot.data![index];
            return ListTile(
              leading: const CircleAvatar(child: Icon(Icons.business)),
              title: Text(client.name),
              subtitle: Text(client.industry),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                // Navigate to client details
              },
            );
          },
        );
      },
    );
  }

  Widget _buildCrisis(BuildContext context, FirebaseService firebaseService) {
    return StreamBuilder<List<CrisisEvent>>(
      stream: firebaseService.getCrisisEvents(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const Center(child: Text('No active crisis events.'));
        }
        return ListView.builder(
          itemCount: snapshot.data!.length,
          itemBuilder: (context, index) {
            final event = snapshot.data![index];
            return ListTile(
              leading: const Icon(Icons.warning, color: Colors.red),
              title: Text(event.title),
              subtitle: Text(event.description),
              trailing: Chip(
                label: Text(event.severity),
                backgroundColor: Colors.red.shade100,
              ),
            );
          },
        );
      },
    );
  }
}
