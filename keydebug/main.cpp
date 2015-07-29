#include <iostream>
#include <libdevcrypto/Common.h>

using namespace std;
using namespace dev;

void search(long start) {

  long unixtime = start;
  long count = 0;

  cout << "{[";
  while(true) {
    std::mt19937_64 mt_rng(unixtime);
    dev::KeyPair key(FixedHash<32>::random(mt_rng));

    cout << endl << "{\"address\": " << key.address() << ",";
    cout << "\"privkey\": " << key.secret() << "},";

    if (count % 1000 == 0) {
      fprintf(stderr, "count=%ld unixtime=%ld\r", count, unixtime);
    }
    unixtime--;
    count++;
  }
}

int main(int, char**) {

  time_t second_time = time(0);
  long nano_time = chrono::high_resolution_clock::now().time_since_epoch().count();
  long unixtime = second_time + nano_time;

  cout << setfill(' ');
  cout << setw(20) << "start unixtime: " << unixtime << endl;
  search(unixtime);
  cout << "done" << endl;
  return 0;
}
