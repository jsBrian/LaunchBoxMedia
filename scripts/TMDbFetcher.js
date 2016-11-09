'use strict';

const _ = require('lodash');
const Q = require('q');
const MovieDbFactory = require('moviedb');
const allCalls = require('./allCalls.js');
const downloadYouTubeFactory = require('./downloadYouTube.js');
const LaunchBox = require('./LaunchBox.js');
const downloadImage = require('./downloadImage.js');
const getGenres = require('./getGenres.js');
const Defer = require('./Defer.js');
const fs = require('fs');

const STATUS_MAP = {
  movie: 'Imported Movie',
  tv: 'Imported Episode'
};

module.exports = o => {
  const Settings = o.Settings;
  const platform = o.platform.trim();
  const emulator = o.emulator;
  const mediaType = o.mediaType;
  const downloadTrailers = o.downloadTrailers && Settings.youtubeApiKey && mediaType === 'movie';
  const downloadMusic = o.downloadMusic && Settings.youtubeApiKey && mediaType === 'tv';
  const useStars = o.useStars;
  const movieList = o.movieList;

  const LAUNCHBOX_PATH = Settings.launchBoxDir;

  LaunchBox.setDirectory(LAUNCHBOX_PATH);
  LaunchBox.addPlatform(platform);

  const VALID_PATHS = {};
  const QUERY_MAP = {
    movie: queryMovie,
    tv: queryTv
  };

  const MovieDB = MovieDbFactory(Settings.tmdbApiKey);
  const downloadYouTube = downloadYouTubeFactory(Settings.youtubeApiKey);

  const tvSeasonPromiseMap = {};
  const tvShowPromiseMap = {};

  return getGenres(mediaType, MovieDB).
    then(genreMap =>
      allCalls(
        _.map(movieList, movieInfo => () => QUERY_MAP[mediaType](movieInfo).
          then(data =>
            addMovie({
              series:           data.series,
              filePath:         movieInfo.filepath,
              releaseDate:      data.release_date,
              description:      data.overview,
              posterImage:      imagePath(data.poster_path, 640),
              backgroundImage:  imagePath(data.backdrop_path, 1280),
              title:            LaunchBox.safeTitle(data.title),
              genres:           _(data.genre_ids).map(genre_id => genreMap[genre_id]).compact().value().join(';'),
              stars:            useStars ? (data.vote_average / 10 * 5 + 0.5 << 0) || 0 : 0
            })
          )
        )
      )
    );

  function addMovie(o) {
    const calls = [
      downloadImage(o.title, o.posterImage, [LAUNCHBOX_PATH, 'Images', platform, 'Box - Front', o.title + '-01.jpg']),
      downloadImage(o.title, o.backgroundImage, [LAUNCHBOX_PATH, 'Images', platform, 'Fanart - Background', o.title + '-01.jpg'])
    ];

    if (downloadMusic) {
      calls.push(downloadYouTube(o.title, ['intro', o.series], [LAUNCHBOX_PATH, 'Music', platform, o.title + '.m4a']));
    }
    if (downloadTrailers) {
      calls.push(downloadYouTube(o.title, ['trailer', o.title, o.releaseDate.slice(0, 4)], [LAUNCHBOX_PATH, 'Videos', platform, o.title + '.mp4']));
    }

    return Q.allSettled(calls).
      then(() =>
        LaunchBox.addGame({
          status: STATUS_MAP[mediaType],
          platform: platform,
          title: o.title,
          emulator: emulator,
          filePath: o.filePath,
          description: o.description,
          releaseDate: o.releaseDate,
          stars: o.stars,
          genres: o.genres
        })
      );
  }
  function imagePath(urlPath, width) {
    if (!urlPath) {
      return;
    }
    width = width || 1280;
    return 'https://image.tmdb.org/t/p/w' + width + urlPath;
  }
  function queryTv(guessedData) {
    return queryTvShow(guessedData.series).
      then(seriesData => queryTvSeasonEpisode(seriesData.id, guessedData.season, guessedData.episodeNumber).
        then(episodeData => {
          return {
            release_date: episodeData.air_date,
            overview: episodeData.overview + '\n\n' + seriesData.overview,
            poster_path: episodeData.still_path,
            series: seriesData.name,
            backdrop_path: seriesData.backdrop_path,
            title: [seriesData.name,
                    'S' + _.padStart(episodeData.season_number, 2, '0') + 'E' + _.padStart(episodeData.episode_number, 2, '0'),
                    episodeData.name].join(' - '),
            genre_ids: seriesData.genre_ids,
            vote_average: episodeData.vote_count > 0 ? episodeData.vote_average : seriesData.vote_average
          };
        })
      );
  }
  function queryTvSeasonEpisode(seriesId, season, episodeNumber) {
    const key = seriesId + ':' + season;

    if (!tvSeasonPromiseMap[key]) {
      tvSeasonPromiseMap[key] = Defer(deferred =>
        MovieDB.tvSeasonInfo({
          id: seriesId,
          season_number: season
        }, (err, res) => {
          if (!res) {
            deferred.reject(err);
            return;
          }
          deferred.resolve(res);
        })
      );
    }

    return tvSeasonPromiseMap[key].
      then(seasonData =>
        _.find(seasonData.episodes, {
          episode_number: episodeNumber
        })
      );
  }
  function queryTvShow(series) {
    if (!tvShowPromiseMap[series]) {
      tvShowPromiseMap[series] = Defer(deferred => 
        MovieDB.searchTv({
          query: series
        }, (err, res) => {
          if (!res || !res.results) {
            deferred.reject(err);
            return;
          }
          deferred.resolve(res.results[0]);
        })
      );
    }
    return tvShowPromiseMap[series];
  }
  function queryMovie(movieData) {
    return Defer(deferred => 
      MovieDB.searchMovie({
        query: movieData.title,
        year: movieData.year
      }, (err, res) => {
        if (!res || !res.results) {
          deferred.reject(err);
          return;
        }
        deferred.resolve(res.results[0]);
      })
    );
  }
};