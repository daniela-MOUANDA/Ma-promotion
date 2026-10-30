import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';

import '../models.dart';
import '../store.dart';
import '../theme.dart';

class TeacherAvatar extends StatelessWidget {
  const TeacherAvatar({
    super.key,
    required this.teacher,
    this.radius = 22,
    this.onTap,
    this.showCameraBadge = false,
  });

  final TeacherAccount teacher;
  final double radius;
  final VoidCallback? onTap;
  final bool showCameraBadge;

  @override
  Widget build(BuildContext context) {
    final path = EpcaStore.instance.photoPaths[teacher.id];
    final file = path == null ? null : File(path);
    final hasPhoto = file != null && file.existsSync();

    final avatar = CircleAvatar(
      radius: radius,
      backgroundColor: const Color(0xFFEEF3FA),
      backgroundImage: hasPhoto ? FileImage(file) : null,
      child: hasPhoto
          ? null
          : Text(
              teacher.initials,
              style: TextStyle(
                fontWeight: FontWeight.w800,
                color: EpcaColors.navy,
                fontSize: radius * 0.62,
              ),
            ),
    );

    final content = showCameraBadge
        ? Stack(
            clipBehavior: Clip.none,
            children: [
              avatar,
              Positioned(
                right: -2,
                bottom: -2,
                child: Container(
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    color: EpcaColors.mint,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                  child: const Icon(Icons.photo_camera, size: 12, color: Colors.white),
                ),
              ),
            ],
          )
        : avatar;

    if (onTap == null) return content;
    return GestureDetector(onTap: onTap, child: content);
  }
}

Future<void> pickTeacherPhoto(BuildContext context, TeacherAccount teacher) async {
  final source = await showModalBottomSheet<ImageSource>(
    context: context,
    showDragHandle: true,
    builder: (context) {
      return SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library, color: EpcaColors.sky),
              title: const Text('Choisir dans la galerie'),
              onTap: () => Navigator.pop(context, ImageSource.gallery),
            ),
            ListTile(
              leading: const Icon(Icons.photo_camera, color: EpcaColors.mint),
              title: const Text('Prendre une photo'),
              onTap: () => Navigator.pop(context, ImageSource.camera),
            ),
            const SizedBox(height: 8),
          ],
        ),
      );
    },
  );
  if (source == null) return;

  final picked = await ImagePicker().pickImage(source: source, imageQuality: 82, maxWidth: 1200);
  if (picked == null) return;

  final dir = await getApplicationDocumentsDirectory();
  final dest = File('${dir.path}/avatar_${teacher.id}.jpg');
  await File(picked.path).copy(dest.path);
  await EpcaStore.instance.setPhotoPath(teacher.id, dest.path);
}
