package in.gramsandesh.announcement;

import jakarta.validation.Valid;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Comparator;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {
    private final AnnouncementRepository repository;
    private final AnnouncementPhotoRepository photos;

    public AnnouncementController(AnnouncementRepository repository, AnnouncementPhotoRepository photos) {
        this.repository = repository;
        this.photos = photos;
    }

    @GetMapping
    public List<AnnouncementResponse> listAnnouncements() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .sorted(Comparator.comparing(Announcement::getUpdatedAt).reversed())
                .map(AnnouncementResponse::from)
                .toList();
    }

    @GetMapping("/{id}/photo")
    public ResponseEntity<byte[]> photo(@PathVariable Long id) {
        AnnouncementPhoto photo = photos.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found."));
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(photo.getContentType()))
                .body(photo.getData());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public AnnouncementResponse createAnnouncement(@Valid @RequestBody CreateAnnouncementRequest request) {
        byte[] photoData = decodePhoto(request.photoDataUrl());
        boolean photoSupported = supportsPhoto(request.category());
        String area = emptyToNull(request.area());
        if (request.category() == AnnouncementCategory.WATER && area == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A ward is required for water announcements.");
        }
        if (photoData != null && !photoSupported) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Photos are supported for program and news announcements.");
        }
        Announcement announcement = new Announcement(
                request.title().trim(),
                request.message().trim(),
                request.category(),
                request.priority() == null ? AnnouncementPriority.NORMAL : request.priority(),
                area,
                request.author() == null || request.author().isBlank() ? "गावकरी" : request.author().trim(),
                request.startsAt(),
                photoData != null,
                waterUpdateTypeFor(request)
        );
        Announcement saved = repository.save(announcement);
        if (photoData != null) photos.save(new AnnouncementPhoto(saved, photoData, "image/jpeg"));
        return AnnouncementResponse.from(saved);
    }

    @PutMapping("/{id}")
    @Transactional
    public AnnouncementResponse updateAnnouncement(@PathVariable Long id,
                                                    @Valid @RequestBody CreateAnnouncementRequest request) {
        Announcement announcement = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Announcement not found."));
        byte[] replacementPhoto = decodePhoto(request.photoDataUrl());
        boolean photoSupported = supportsPhoto(request.category());
        String area = emptyToNull(request.area());
        if (request.category() == AnnouncementCategory.WATER && area == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A ward is required for water announcements.");
        }
        if (replacementPhoto != null && !photoSupported) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Photos are supported for program and news announcements.");
        }

        AnnouncementPhoto existingPhoto = photos.findById(id).orElse(null);
        boolean hasPhoto = photoSupported && (replacementPhoto != null || existingPhoto != null);
        announcement.updateContent(
                request.title().trim(),
                request.message().trim(),
                request.category(),
                request.priority() == null ? AnnouncementPriority.NORMAL : request.priority(),
                area,
                request.author() == null || request.author().isBlank() ? announcement.getAuthor() : request.author().trim(),
                request.startsAt(),
                hasPhoto,
                waterUpdateTypeFor(request)
        );

        if (!photoSupported && existingPhoto != null) {
            photos.delete(existingPhoto);
        } else if (replacementPhoto != null) {
            if (existingPhoto == null) photos.save(new AnnouncementPhoto(announcement, replacementPhoto, "image/jpeg"));
            else existingPhoto.replaceData(replacementPhoto, "image/jpeg");
        }
        return AnnouncementResponse.from(repository.save(announcement));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void deleteAnnouncement(@PathVariable Long id) {
        Announcement announcement = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Announcement not found."));
        photos.findById(id).ifPresent(photos::delete);
        repository.delete(announcement);
    }

    private byte[] decodePhoto(String photoDataUrl) {
        if (photoDataUrl == null || photoDataUrl.isBlank()) return null;
        String prefix = "data:image/jpeg;base64,";
        if (!photoDataUrl.startsWith(prefix)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Photo must be a JPEG image.");
        }
        try {
            byte[] data = java.util.Base64.getDecoder().decode(photoDataUrl.substring(prefix.length()));
            if (data.length > 1_500_000) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Photo must be smaller than 1.5 MB after resizing.");
            }
            return data;
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Photo data is invalid.");
        }
    }

    private boolean supportsPhoto(AnnouncementCategory category) {
        return category == AnnouncementCategory.PROGRAM
                || category == AnnouncementCategory.GOOD_NEWS
                || category == AnnouncementCategory.BAD_NEWS
                || category == AnnouncementCategory.GENERAL;
    }

    private String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private WaterUpdateType waterUpdateTypeFor(CreateAnnouncementRequest request) {
        if (request.category() != AnnouncementCategory.WATER) return null;
        return request.waterUpdateType() == null ? WaterUpdateType.REGULAR : request.waterUpdateType();
    }
}
