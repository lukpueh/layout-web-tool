def before_after_snapshot(before_dict, after_dict):
  unchanged_files = []
  modified_files = []
  added_files = []
  removed_files = []
  for key in before_dict:
    if key in after_dict:
      if before_dict[key] == after_dict[key]:
        unchanged_files.append(key)
      else:
        modified_files.append(key)
    else:
      removed_files.append(key)
  for key in after_dict:
    if key not in before_dict:
      added_files.append(key)

  print('unchanged = ', str(unchanged_files))
  print('modified = ', str(modified_files))
  print('added = ', str(added_files))
  print('removed = ', str(removed_files))

before = {
'one.tgz': '1234567890abcdef',
'foo/two.tgz': '0000001111112222',
'three.txt': '1111222233334444',
'bar/bat/four.tgz': '6677889900112233'
}

after = {
  'five.txt': '5555555555555555',
  'one.tgz': '1234567890abcdef',
  'foo/two.tgz': 'ffffffffffffffff',
  'bar/bat/four.tgz': '6677889900112233',
  'baz/six.tgz': '6666666666666666'
}

before_after_snapshot(before, after)
