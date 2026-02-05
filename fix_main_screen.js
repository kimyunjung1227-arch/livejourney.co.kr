const fs = require('fs');
const path = require('path');

const filePath = path.join('c:\\Users\\wnd12\\Desktop\\mvp1\\mobile\\src\\screens\\MainScreen.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace renderSection function
// We look for the function signature and the closing bracket of the useCallback
const startMarker = "const renderSection = useCallback((title, data, sectionType, showMore = true, showLiveBadge = false) => {";
// The end marker is tricky because of nesting, but we know it ends with }, [renderPostCard, navigation]);
const endMarker = "}, [renderPostCard, navigation]);";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    const newRenderSection = `const renderSection = useCallback((title, data, sectionType, showMore = true, showLiveBadge = false) => {
    if (data.length === 0) {
      const emptyMessages = {
        '📍 실시간 여행 피드': {
          icon: 'travel-explore',
          title: '아직 여행 이야기가 올라오지 않았어요',
          subtitle: '가장 먼저 있는 장소의 분위기, 날씨를 공유해 주세요',
        },
        '🔥 지금 사람 붐비는 곳': {
          icon: 'people',
          title: '아직 붐비는 곳 정보가 없어요',
          subtitle: '첫 번째로 붐비는 곳을 제보해보세요!',
        },
        '✨ 추천 여행지': {
          icon: 'recommend',
          title: '추천 장소가 아직 없어요',
          subtitle: '첫 번째로 추천 장소를 공유해보세요!',
        },
        // 호환성 유지
        '실시간 여행': {
          icon: 'travel-explore',
          title: '아직 여행 이야기가 올라오지 않았어요',
          subtitle: '가장 먼저 있는 장소의 분위기, 날씨를 공유해 주세요',
        },
        '지금 사람 붐비는 곳': {
          icon: 'people',
          title: '아직 붐비는 곳 정보가 없어요',
          subtitle: '첫 번째로 붐비는 곳을 제보해보세요!',
        },
        '추천 장소': {
          icon: 'recommend',
          title: '추천 장소가 아직 없어요',
          subtitle: '첫 번째로 추천 장소를 공유해보세요!',
        },
      };
      
      // 타이틀 키워드 매칭
      let messageKey = '실시간 여행';
      if (title.includes('사람') || title.includes('붐비') || title.includes('crowd')) {
        messageKey = '지금 사람 붐비는 곳';
      } else if (title.includes('추천') || title.includes('recommend')) {
        messageKey = '추천 장소';
      }
      
      const message = emptyMessages[title] || emptyMessages[messageKey] || {
        icon: 'images-outline',
        title: '아직 내용이 없어요',
        subtitle: '첫 번째 게시물을 올려보세요!',
      };

      return (
        <View style={styles.emptySection}>
          <Ionicons name={message.icon} size={64} color={COLORS.textSubtle} />
          <Text style={styles.emptyText}>{message.title}</Text>
          <Text style={styles.emptySubtext}>{message.subtitle}</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('UploadTab')}
          >
            <Ionicons name="add-circle" size={20} color="white" />
            <Text style={styles.emptyButtonText}>첫 활동 올리기</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {showLiveBadge && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>
            )}
          </View>
          {showMore && (
            <TouchableOpacity
              style={styles.moreButton}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              onPress={() => {
                console.log('Navigating to Detail with filter:', sectionType);
                navigation.navigate('Detail', { filter: sectionType });
              }}
            >
              <Text style={styles.moreButtonText}>더보기</Text>
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={data}
          renderItem={({ item }) => renderPostCard({ item, sectionType })}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          snapToInterval={180 + 12} // CARD_WIDTH(180) + gap(12)
          decelerationRate="fast"
          snapToAlignment="start"
        />
      </>
    );`;

    content = content.substring(0, startIndex) + newRenderSection + content.substring(endIndex);
    console.log("Replaced renderSection function.");
} else {
    console.log("Could not find renderSection function block.");
}

// 2. Replace call sites with garbled text
// We can't easily match the garbled text by string literal in JS source if source is UTF8 but content is not?
// But we know the structure of the calls.

// Replace Realtime call
// {renderSection('...', filteredRealtimeData, 'realtime', true, true)}
content = content.replace(
    /\{renderSection\('[^']+', filteredRealtimeData, 'realtime', true, true\)\}/g,
    "{renderSection('📍 실시간 여행 피드', filteredRealtimeData, 'realtime', true, true)}"
);

// Replace Crowded call
// {renderSection('...', filteredCrowdedData, 'crowded')}
content = content.replace(
    /\{renderSection\('[^']+', filteredCrowdedData, 'crowded'\)\}/g,
    "{renderSection('🔥 지금 사람 붐비는 곳', filteredCrowdedData, 'crowded')}"
);

// Replace Recommended call (wait, it might be separate view block)
// The view file showed:
// <View style={styles.sectionHeader}>
//   <Text style={styles.sectionTitle}>? õ </Text>
// </View>
// This was manual header, not renderSection call?
// Ah, lines 1076: <Text style={styles.sectionTitle}>? õ </Text>
// And then manual map.

content = content.replace(
    /<Text style=\{styles\.sectionTitle\}>[^<]+<\/Text>/g,
    (match) => {
        if (match.includes('?')) { // Heuristic
            return `<Text style={styles.sectionTitle}>✨ 추천 여행지</Text>`;
        }
        return match;
    }
);

// Also replace the category filter texts
/*
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === category && [
*/

fs.writeFileSync(filePath, content, 'utf8');
console.log("File updated successfully.");
