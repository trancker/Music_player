import React, { PureComponent, useCallback, useState } from 'react';
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu';

import { MenuContainer } from './styles';
import { Alert, Platform, StyleProp, Text, View, ViewStyle } from 'react-native';
import { useSongs } from '../../hooks/songs';
import CreatePlaylistModal from '../CreatePlaylistModal';
import { remove } from 'react-native-track-player';
import { openLimitedPhotoLibraryPicker } from 'react-native-permissions';

interface MenuPopupProps {
  navigation?: any;
  songs: MusicFile[];
  trigerStyle?: ViewStyle;
  children?: any;
  removeFromPlaylistId?: string;
  onOptionSelected?: (option?: 'goToArtist' | 'goToAlbum' | 'deleteSong' | 'addToPlaylist' | 'removeFromPlaylist') => void;
  deleteOption?: boolean;
}

type OptionSelected = 'goToArtist' | 'goToAlbum' | 'deleteSong' | 'addToPlaylist' | 'removeFromPlaylist';

interface MusicFile{
  id : number,
  title : string,
  author : string,
  album : string,
  genre : string,
  duration : number, 
  cover :string,
  blur : string,
  path : string
}

const MenuPopup: React.FC<MenuPopupProps> = ({ navigation, songs, children, trigerStyle, removeFromPlaylistId = '', onOptionSelected, deleteOption = true }) => {
  const [isModalActive, setIsModalActive] = useState<boolean>(false);

  const { artistList, deleteSong, removeSongsFromPlaylist } = useSongs();

  const handleGoToAlbum = useCallback((song: MusicFile, optionSelected: OptionSelected) => {
    onOptionSelected && onOptionSelected(optionSelected);

    navigation.navigate('AlbumPage',{
      album: {
        name: song.album,
        cover: song.cover,
      },
      artist: song.author,
    })
  }, []);

  const handleGoToArtist = useCallback((song: MusicFile, optionSelected: OptionSelected) => {
    onOptionSelected && onOptionSelected(optionSelected);

    const artist = artistList.find(a => a.artist == song.author);

    if(artist){
      const {numberOfAlbums, numberOfSongs, albums} = artist;

      navigation.jumpTo('ArtistPage', {
        albums,
        name: artist.artist,
        numberOfAlbums,
        numberOfSongs,
      });
    }else{
      console.log("Artist not found (songList - handleGoToArtist)")
    }

  }, [artistList]);

  const handleDeleteSong = useCallback((optionSelected: OptionSelected) => {
    Alert.alert(
      "Excluir M??sica",
      `Voc?? tem certeza que queres excluir a m??sica${songs[0].title}${songs.length == 2 ? ` e ${songs[1].title}`: songs.length > 2 ? ` e outras ${songs.length - 1} m??sicas` : null}? ${Platform.OS === 'android' ? '\n\nATEN????O: Caso esteja rodando uma vers??o maior do que o Android 5, n??o ser?? poss??vel excluir m??sicas que prov??m de algum dispositivo externo (Cart??o SD). Deseja mesmo continuar?': ''}`,
      [
        {
          text: "Cancelar",
          onPress: () => console.log("A????o cancelada"),
          style: "cancel"
        },
        { 
          text: "Sim", 
          onPress: () => {
            onOptionSelected && onOptionSelected(optionSelected); 
            deleteSong(songs);
          },
        }
      ],
      { cancelable: false }
    );
  }, [songs]);
  
  const handleDeleteSongsFromPlaylist = useCallback((optionSelected: OptionSelected) => {
    Alert.alert(
      "Remover M??sicas",
      `Voc?? tem certeza que queres excluir a m??sica ${songs[0].title}${songs.length == 2 ? `e ${songs[1].title}`: songs.length > 2 ? `e outras ${songs.length - 1} m??sicas` : ''} da playlist?`,
      [
        {
          text: "Cancelar",
          onPress: () => console.log("A????o cancelada"),
          style: "cancel"
        },
        { 
          text: "Sim", 
          onPress: () => {
            onOptionSelected && onOptionSelected(optionSelected);
            removeSongsFromPlaylist(songs, removeFromPlaylistId);
          },
        }
      ],
      { cancelable: false }
    );
  }, [songs, removeFromPlaylistId]);

  const handleAddToPlaylist = useCallback((songs: MusicFile[], optionSelected: OptionSelected) => {
    navigation.navigate('PlaylistList', {selectionMode: true, songs: songs});
    onOptionSelected && onOptionSelected(optionSelected);
  }, [onOptionSelected]);

  return (
    <MenuContainer>
      <CreatePlaylistModal active={isModalActive} onClose={() => {setIsModalActive(false)}} songs={songs}/>
      <Menu>
        <MenuTrigger>
          <View style={{justifyContent: 'center', alignItems: 'center', width: 30, ...trigerStyle}} >
            { children }
          </View>
        </MenuTrigger>
        <MenuOptions customStyles={{
          optionsContainer: {
            backgroundColor: '#151515',
            width: 150,
          },
        }}>
          { songs.length == 1
          ?(
            <>
              <MenuOption onSelect={() => {handleGoToAlbum(songs[0], 'goToAlbum')}}>
                <View style={{padding: 10, borderLeftColor: "#50f", borderLeftWidth: 2}}>
                  <Text style={{color: '#e5e5e5', fontSize: 15}}> Ir para Album </Text>
                </View>
              </MenuOption>
              <MenuOption onSelect={() => {handleGoToArtist(songs[0], 'goToArtist')}}>
                <View style={{padding: 10, borderLeftColor: "#50f", borderLeftWidth: 2}}>
                  <Text style={{color: '#e5e5e5', fontSize: 15}}> Ir para Artista </Text>
                </View>
              </MenuOption>
            </>
            )
            : null
          }
          {
            removeFromPlaylistId != ''
              ?(
                <MenuOption onSelect={() => {handleDeleteSongsFromPlaylist('removeFromPlaylist')}}>
                  <View style={{padding: 10, borderLeftColor: "#50f", borderLeftWidth: 2}}>
                    <Text style={{color: '#e5e5e5', fontSize: 15}}>Remover da Playlist</Text>
                  </View>
                </MenuOption>
              )
              : (
                <MenuOption onSelect={() => {handleAddToPlaylist(songs, 'addToPlaylist')}}>
                  <View style={{padding: 10, borderLeftColor: "#50f", borderLeftWidth: 2}}>
                    <Text style={{color: '#e5e5e5', fontSize: 15}}>Adicionar para playlist...</Text>
                  </View>
                </MenuOption>
              )
          }
          { deleteOption &&
            <MenuOption onSelect={() => {handleDeleteSong('deleteSong')}}>
              <View style={{padding: 10, borderLeftColor: "#50f", borderLeftWidth: 2}}>
                <Text style={{color: '#e5e5e5', fontSize: 15}}>{songs.length > 1 ? 'Excluir M??sicas' : 'Excluir M??sica'}</Text>
              </View>
            </MenuOption>
          }
        </MenuOptions>
      </Menu>
    </MenuContainer>
  );
};

export default React.memo(MenuPopup);