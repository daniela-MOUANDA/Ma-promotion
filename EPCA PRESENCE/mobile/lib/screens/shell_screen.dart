import 'package:flutter/material.dart';

import '../store.dart';
import '../theme.dart';
import 'classes_screen.dart';
import 'history_screen.dart';
import 'profile_screen.dart';
import 'timetable_screen.dart';

class ShellScreen extends StatefulWidget {
  const ShellScreen({super.key});

  @override
  State<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends State<ShellScreen> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final teacher = EpcaStore.instance.currentTeacher!;
    final pages = [
      ClassesScreen(
        onOpenProfile: () => setState(() => _index = 3),
        onOpenHistory: () => setState(() => _index = 1),
      ),
      const HistoryScreen(),
      const TimetableScreen(),
      ProfileScreen(teacher: teacher),
    ];

    return Scaffold(
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.groups, color: EpcaColors.muted),
            selectedIcon: Icon(Icons.groups, color: EpcaColors.sky),
            label: 'Classes',
          ),
          NavigationDestination(
            icon: Icon(Icons.history, color: EpcaColors.muted),
            selectedIcon: Icon(Icons.history, color: Color(0xFF7C3AED)),
            label: 'Appels',
          ),
          NavigationDestination(
            icon: Icon(Icons.event, color: EpcaColors.muted),
            selectedIcon: Icon(Icons.event, color: EpcaColors.mint),
            label: 'Emploi',
          ),
          NavigationDestination(
            icon: Icon(Icons.person, color: EpcaColors.muted),
            selectedIcon: Icon(Icons.person, color: EpcaColors.amber),
            label: 'Profil',
          ),
        ],
      ),
    );
  }
}
