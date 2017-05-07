import shutil
import os

OUTPUT_DIR = 'build/'


def get_files(path):
    for file in os.listdir(path):
        if os.path.isfile(os.path.join(path, file)):
            yield file


def get_js_files(path):
    return filter(lambda file: file.endswith('.js'), get_files(path))


# Dir name should end with /
def copyover_from_extension(dir, subdir=''):
    for filename in get_files(dir + subdir):
        src = '%s%s%s' % (dir, subdir, filename)
        dest = '%s%s%s' % (OUTPUT_DIR, subdir, filename)
        print("[build.py] Copying %s to %s" % (src, dest))
        shutil.copyfile(src, dest)


def minify_js(dir, subdir):
    for filename in get_js_files(dir + subdir):
        src = '%s%s%s' % (dir, subdir, filename)
        dest = '%s%s%s.min' % (OUTPUT_DIR, subdir, filename)
        # cmd = "google-closure-compiler --compilationLevel=ADVANCED --warningLevel=VERBOSE --externs=[chrome_externs.js] --defines='DEV=false' %s > %s" % (src, dest)
        cmd = "java -jar node_modules/google-closure-compiler/compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --externs chrome_externs.js --externs jquery_externs.js --define 'DEV=false' %s > %s" % (src, dest)
        print("[build.py] %s" % (cmd))
        os.system(cmd)
        print("[build.py] Removing %s%s%s" % (OUTPUT_DIR, subdir, filename))
        os.remove('%s%s%s' % (OUTPUT_DIR, subdir, filename))

print("[build.py] Removing %s dir if it exists..." % (OUTPUT_DIR))
# Remove build folder
if os.path.exists(OUTPUT_DIR):
    shutil.rmtree(OUTPUT_DIR)

# Create build folder
print("[build.py] Creating %s dir..." % (OUTPUT_DIR))
os.makedirs(OUTPUT_DIR)

print("[build.py] Creating nested assets/ lib/ src/ directories...")
# Create nested assets/ lib/ src/ folders
os.makedirs("%sassets" % (OUTPUT_DIR))
os.makedirs("%slib" % (OUTPUT_DIR))
os.makedirs("%ssrc" % (OUTPUT_DIR))

print("[build.py] Copying over top-level files in extension/...")
copyover_from_extension('extension/')

print("[build.py] Copying over nested files...")
for subdir in ['assets/', 'lib/', 'src/']:
    copyover_from_extension('extension/', subdir)

print("[build.py] Minifying .js files...")
# for subdir in ['src/']:
for subdir in ['src/', 'lib/']:
    minify_js('extension/', subdir)
