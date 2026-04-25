import * as React from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/constants/Typography';
import { ItemList } from '@/components/ItemList';
import { ItemGroup } from '@/components/ItemGroup';
import { Item } from '@/components/Item';
import { useSettingMutable } from '@/sync/storage';
import { QuickPhrase } from '@/sync/settings';
import { t } from '@/text';
import { Modal } from '@/modal';
import { Switch } from '@/components/Switch';
import { layout } from '@/components/layout';

export default function QuickPhrasesSettingsScreen() {
    const [quickPhrases, setQuickPhrases] = useSettingMutable('quickPhrases');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [editingPhrase, setEditingPhrase] = React.useState<QuickPhrase | null>(null);
    const [showEditor, setShowEditor] = React.useState(false);
    const [editorTitle, setEditorTitle] = React.useState('');
    const [editorContent, setEditorContent] = React.useState('');
    const [titleError, setTitleError] = React.useState('');
    const [contentError, setContentError] = React.useState('');

    const filteredPhrases = React.useMemo(() => {
        return quickPhrases.filter(phrase =>
            phrase.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            phrase.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [quickPhrases, searchQuery]);

    const sortedPhrases = React.useMemo(() => {
        return [...filteredPhrases].sort((a, b) => a.order - b.order);
    }, [filteredPhrases]);

    const handleAdd = React.useCallback(() => {
        setEditorTitle('');
        setEditorContent('');
        setTitleError('');
        setContentError('');
        setEditingPhrase(null);
        setShowEditor(true);
    }, []);

    const handleEdit = React.useCallback((phrase: QuickPhrase) => {
        if (phrase.isBuiltIn) {
            return; // Built-in phrases cannot be edited
        }
        setEditorTitle(phrase.title);
        setEditorContent(phrase.content);
        setTitleError('');
        setContentError('');
        setEditingPhrase(phrase);
        setShowEditor(true);
    }, []);

    const handleDelete = React.useCallback(async (id: string) => {
        const phrase = quickPhrases.find(p => p.id === id);
        if (phrase?.isBuiltIn) {
            return; // Built-in phrases cannot be deleted
        }

        const confirmed = await Modal.confirm(
            t('quickPhrasesDelete'),
            t('quickPhrasesDeleteConfirm'),
            { confirmText: t('common.delete'), destructive: true }
        );

        if (confirmed) {
            const updatedPhrases = quickPhrases.filter(p => p.id !== id);
            setQuickPhrases(updatedPhrases);
        }
    }, [quickPhrases, setQuickPhrases]);

    const handleMoveUp = React.useCallback((phrase: QuickPhrase) => {
        if (phrase.order <= 0) return;

        const phrasesToUpdate = [...quickPhrases];
        const currentIndex = phrasesToUpdate.findIndex(p => p.id === phrase.id);
        if (currentIndex <= 0) return;

        const prevPhrase = phrasesToUpdate[currentIndex - 1];
        phrasesToUpdate[currentIndex] = { ...phrase, order: phrase.order - 1 };
        phrasesToUpdate[currentIndex - 1] = { ...prevPhrase, order: prevPhrase.order + 1 };

        setQuickPhrases(phrasesToUpdate);
    }, [quickPhrases, setQuickPhrases]);

    const handleMoveDown = React.useCallback((phrase: QuickPhrase) => {
        const phrasesToUpdate = [...quickPhrases];
        const currentIndex = phrasesToUpdate.findIndex(p => p.id === phrase.id);
        if (currentIndex === -1 || currentIndex === phrasesToUpdate.length - 1) return;

        const nextPhrase = phrasesToUpdate[currentIndex + 1];
        phrasesToUpdate[currentIndex] = { ...phrase, order: phrase.order + 1 };
        phrasesToUpdate[currentIndex + 1] = { ...nextPhrase, order: nextPhrase.order - 1 };

        setQuickPhrases(phrasesToUpdate);
    }, [quickPhrases, setQuickPhrases]);

    const handleToggleEnabled = React.useCallback((id: string) => {
        const updatedPhrases = quickPhrases.map(p => {
            if (p.id === id) {
                return { ...p, enabled: !p.enabled };
            }
            return p;
        });
        setQuickPhrases(updatedPhrases);
    }, [quickPhrases, setQuickPhrases]);

    const handleSave = React.useCallback(() => {
        let hasError = false;

        if (!editorTitle.trim()) {
            setTitleError(t('quickPhraseEditorTitleError'));
            hasError = true;
        } else if (editorTitle.length > 30) {
            setTitleError(t('quickPhraseEditorTitleTooLong'));
            hasError = true;
        } else {
            setTitleError('');
        }

        if (!editorContent.trim()) {
            setContentError(t('quickPhraseEditorContentError'));
            hasError = true;
        } else if (editorContent.length > 1000) {
            setContentError(t('quickPhraseEditorContentTooLong'));
            hasError = true;
        } else {
            setContentError('');
        }

        if (hasError) return;

        const maxOrder = Math.max(...quickPhrases.map(p => p.order), -1);

        if (editingPhrase) {
            const updatedPhrases = quickPhrases.map(p => {
                if (p.id === editingPhrase.id) {
                    return {
                        ...p,
                        title: editorTitle.trim(),
                        content: editorContent.trim(),
                    };
                }
                return p;
            });
            setQuickPhrases(updatedPhrases);
        } else {
            const newPhrase: QuickPhrase = {
                id: `custom-${Date.now()}`,
                title: editorTitle.trim(),
                content: editorContent.trim(),
                isBuiltIn: false,
                enabled: true,
                order: maxOrder + 1,
            };
            setQuickPhrases([...quickPhrases, newPhrase]);
        }

        setShowEditor(false);
        setEditingPhrase(null);
        setEditorTitle('');
        setEditorContent('');
    }, [editorTitle, editorContent, editingPhrase, quickPhrases, setQuickPhrases]);

    const builtInPhrases = sortedPhrases.filter(p => p.isBuiltIn);
    const customPhrases = sortedPhrases.filter(p => !p.isBuiltIn);

    return (
        <>
            <ItemList style={{ paddingTop: 0 }}>
                <View style={{ maxWidth: layout.maxWidth, alignSelf: 'center', width: '100%' }}>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t('quickPhrasesSearchPlaceholder')}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#8E8E93"
                        />
                    </View>

                    {builtInPhrases.length > 0 && (
                        <ItemGroup
                            title={t('quickPhrasesBuiltIn')}
                            footer={t('quickPhrasesBuiltInHelp')}
                        >
                            {builtInPhrases.map((phrase) => (
                                <View key={phrase.id} style={styles.phraseItem}>
                                    <View style={styles.phraseInfo}>
                                        <Text style={styles.phraseTitle}>{phrase.title}</Text>
                                        <Text style={styles.phraseContent} numberOfLines={2}>
                                            {phrase.content}
                                        </Text>
                                    </View>
                                    <Switch
                                        value={phrase.enabled}
                                        onValueChange={() => handleToggleEnabled(phrase.id)}
                                    />
                                </View>
                            ))}
                        </ItemGroup>
                    )}

                    {customPhrases.length > 0 && (
                        <ItemGroup title={t('common.custom')}>
                            {customPhrases.map((phrase, index) => (
                                <View key={phrase.id} style={styles.phraseItem}>
                                    <View style={styles.phraseInfo}>
                                        <Text style={styles.phraseTitle}>{phrase.title}</Text>
                                        <Text style={styles.phraseContent} numberOfLines={2}>
                                            {phrase.content}
                                        </Text>
                                    </View>
                                    <View style={styles.phraseActions}>
                                        <Pressable
                                            onPress={() => handleMoveUp(phrase)}
                                            style={({ pressed }) => [
                                                styles.actionButton,
                                                index === 0 && styles.actionButtonDisabled,
                                                pressed && styles.actionButtonPressed,
                                            ]}
                                            disabled={index === 0}
                                        >
                                            <Ionicons name="chevron-up" size={20} color="#007AFF" />
                                        </Pressable>
                                        <Pressable
                                            onPress={() => handleMoveDown(phrase)}
                                            style={({ pressed }) => [
                                                styles.actionButton,
                                                index === customPhrases.length - 1 && styles.actionButtonDisabled,
                                                pressed && styles.actionButtonPressed,
                                            ]}
                                            disabled={index === customPhrases.length - 1}
                                        >
                                            <Ionicons name="chevron-down" size={20} color="#007AFF" />
                                        </Pressable>
                                        <Pressable
                                            onPress={() => handleEdit(phrase)}
                                            style={({ pressed }) => [
                                                styles.actionButton,
                                                pressed && styles.actionButtonPressed,
                                            ]}
                                        >
                                            <Ionicons name="create-outline" size={20} color="#007AFF" />
                                        </Pressable>
                                        <Pressable
                                            onPress={() => handleDelete(phrase.id)}
                                            style={({ pressed }) => [
                                                styles.actionButton,
                                                pressed && styles.actionButtonPressed,
                                            ]}
                                        >
                                            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                        </Pressable>
                                    </View>
                                </View>
                            ))}
                        </ItemGroup>
                    )}

                    {sortedPhrases.length === 0 && (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="flash-outline" size={60} color="#C7C7CC" />
                            <Text style={styles.emptyText}>
                                {t('quickPhrasesEmpty')}
                            </Text>
                        </View>
                    )}

                    <Pressable
                        style={({ pressed }) => [
                            styles.addButton,
                            pressed && styles.addButtonPressed,
                        ]}
                        onPress={handleAdd}
                    >
                        <Ionicons name="add" size={24} color="#007AFF" />
                        <Text style={styles.addButtonText}>{t('quickPhrasesAdd')}</Text>
                    </Pressable>
                </View>
            </ItemList>

            {showEditor && (
                <View style={styles.modalOverlay}>
                    <Pressable style={styles.modalBackdrop} onPress={() => setShowEditor(false)} />
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editingPhrase ? t('quickPhrasesEdit') : t('quickPhrasesAdd')}
                        </Text>

                        <Text style={styles.label}>{t('quickPhraseEditorTitle')}</Text>
                        <TextInput
                            style={[styles.input, titleError && styles.inputError]}
                            placeholder={t('quickPhraseEditorTitlePlaceholder')}
                            value={editorTitle}
                            onChangeText={setEditorTitle}
                            placeholderTextColor="#8E8E93"
                            maxLength={30}
                        />
                        {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}

                        <Text style={styles.label}>{t('quickPhraseEditorContent')}</Text>
                        <TextInput
                            style={[styles.textArea, contentError && styles.inputError]}
                            placeholder={t('quickPhraseEditorContentPlaceholder')}
                            value={editorContent}
                            onChangeText={setEditorContent}
                            placeholderTextColor="#8E8E93"
                            multiline
                            numberOfLines={4}
                            maxLength={1000}
                        />
                        {contentError ? <Text style={styles.errorText}>{contentError}</Text> : null}

                        <View style={styles.modalButtons}>
                            <Pressable
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowEditor(false)}
                            >
                                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleSave}
                            >
                                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            )}
        </>
    );
}

const styles = StyleSheet.create((theme) => ({
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfacePressed,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 16,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text,
        ...Typography.default(),
    },
    phraseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    phraseInfo: {
        flex: 1,
        marginRight: 8,
    },
    phraseTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 4,
        ...Typography.default('semiBold'),
    },
    phraseContent: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        ...Typography.default(),
    },
    phraseActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionButton: {
        padding: 8,
        borderRadius: 8,
    },
    actionButtonDisabled: {
        opacity: 0.3,
    },
    actionButtonPressed: {
        backgroundColor: theme.colors.surfacePressed,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        marginTop: 16,
        textAlign: 'center',
        ...Typography.default(),
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.button.primary.background,
        borderRadius: 12,
        paddingVertical: 16,
        marginTop: 16,
        marginBottom: 32,
    },
    addButtonPressed: {
        opacity: 0.7,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.button.primary.tint,
        marginLeft: 8,
        ...Typography.default('semiBold'),
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContent: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxWidth: 500,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 24,
        ...Typography.default('semiBold'),
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginTop: 16,
        marginBottom: 8,
        ...Typography.default('semiBold'),
    },
    input: {
        backgroundColor: theme.colors.surfacePressed,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        color: theme.colors.text,
        ...Typography.default(),
    },
    inputError: {
        borderWidth: 1,
        borderColor: '#FF3B30',
    },
    textArea: {
        backgroundColor: theme.colors.surfacePressed,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        color: theme.colors.text,
        minHeight: 100,
        textAlignVertical: 'top',
        ...Typography.default(),
    },
    errorText: {
        fontSize: 12,
        color: '#FF3B30',
        marginTop: 4,
        ...Typography.default(),
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 24,
        gap: 12,
    },
    modalButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: theme.colors.surfacePressed,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        ...Typography.default('semiBold'),
    },
    saveButton: {
        backgroundColor: '#007AFF',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        ...Typography.default('semiBold'),
    },
}));
